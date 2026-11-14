from django.db import IntegrityError, transaction
from datetime import timedelta
from decimal import Decimal
from django.db.models import DecimalField, ExpressionWrapper, F, Min, Max, Sum, Q, Value
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import viewsets, mixins
from rest_framework.filters import SearchFilter
from rest_framework.permissions import BasePermission, SAFE_METHODS
from rest_framework.exceptions import ValidationError
from .models import Allergy, Category, Supplier, Doctor, Patient, Medication, DrugBatch, Prescription, DispensingTransaction
from .serializers import LOW_STOCK_THRESHOLD, EXPIRY_WARNING_DAYS, AllergySerializer, StockSerializer, CategorySerializer, SupplierSerializer, DoctorSerializer, PatientSerializer, MedicationSerializer, BatchSerializer, PrescriptionSerializer, DispensingSerializer
from .services import dispense


def role(user):
    if not user.is_authenticated:
        return None
    if user.is_superuser or user.groups.filter(name="Admin").exists():
        return "Admin"
    if user.groups.filter(name="Pharmacist").exists():
        return "Pharmacist"
    if user.groups.filter(name="Patient").exists():
        return "Patient"
    return None


class DomainPermission(BasePermission):
    def has_permission(self, request, view):
        current = role(request.user)
        return current in ["Admin", "Pharmacist"] or (current == "Patient" and request.method in SAFE_METHODS)


class ResourceViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    permission_classes = [DomainPermission]
    filter_backends = [SearchFilter]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        qs = super().get_queryset()
        if role(self.request.user) == "Patient":
            if qs.model == Patient:
                return qs.filter(user=self.request.user)
            if qs.model in [Prescription, DispensingTransaction]:
                return qs.filter(patient__user=self.request.user)
            return qs.none()
        return qs

    def perform_create(self, serializer):
        try:
            with transaction.atomic():
                serializer.save()
        except IntegrityError:
            raise ValidationError({"code": "conflict"})

    def perform_update(self, serializer):
        try:
            with transaction.atomic():
                # Prevent a stock update or prescription edit racing with dispensing.
                locked = self.get_queryset().select_for_update().get(pk=serializer.instance.pk)
                serializer.instance = locked
                serializer.save()
        except IntegrityError:
            raise ValidationError({"code": "conflict"})


class PatientViewSet(ResourceViewSet):
    queryset = Patient.objects.all().order_by("reference")
    serializer_class = PatientSerializer
    search_fields = ["reference", "full_name", "phone"]


class CategoryViewSet(ResourceViewSet):
    queryset = Category.objects.all().order_by("name")
    serializer_class = CategorySerializer


class SupplierViewSet(ResourceViewSet):
    queryset = Supplier.objects.all().order_by("name")
    serializer_class = SupplierSerializer


class DoctorViewSet(ResourceViewSet):
    queryset = Doctor.objects.all().order_by("full_name")
    serializer_class = DoctorSerializer


class MedicationViewSet(ResourceViewSet):
    queryset = Medication.objects.all().order_by("name")
    serializer_class = MedicationSerializer
    search_fields = ["name", "active_ingredient", "strength"]


class BatchViewSet(ResourceViewSet):
    queryset = DrugBatch.objects.select_related("medication").order_by("expires_on")
    serializer_class = BatchSerializer
    search_fields = ["lot_number", "medication__name"]
    # Received stock is immutable through this API after creation; dispensing owns decrements.
    http_method_names = ["get", "post", "head", "options"]


class PrescriptionViewSet(ResourceViewSet):
    queryset = Prescription.objects.select_related("patient").prefetch_related("lines__medication").order_by("-issued_on", "-id")
    serializer_class = PrescriptionSerializer
    search_fields = ["reference", "patient__full_name", "lines__medication__name"]
    http_method_names = ["get", "post", "head", "options"]


class DispensingViewSet(ResourceViewSet):
    queryset = DispensingTransaction.objects.select_related("patient", "batch__medication").order_by("-dispensed_at")
    serializer_class = DispensingSerializer
    search_fields = ["reference", "patient__full_name", "batch__medication__name"]
    http_method_names = ["get", "post", "head", "options"]

    def perform_create(self, serializer):
        serializer.instance = dispense(**serializer.validated_data, pharmacist=self.request.user)


class AllergyViewSet(ResourceViewSet):
    queryset = Allergy.objects.all().order_by("name")
    serializer_class = AllergySerializer
    search_fields = ["name", "ingredient_keyword"]


class StockViewSet(ResourceViewSet):
    """Per-medication stock summary. Expired and empty batches are not counted as available."""
    serializer_class = StockSerializer
    queryset = Medication.objects.all()
    search_fields = ["name", "active_ingredient"]
    http_method_names = ["get", "head", "options"]

    def get_queryset(self):
        if role(self.request.user) == "Patient":
            return Medication.objects.none()
        today = timezone.localdate()
        usable = Q(batches__expires_on__gt=today, batches__stock_quantity__gt=0)
        money = DecimalField(max_digits=14, decimal_places=2)
        qs = Medication.objects.filter(is_active=True).prefetch_related("batches").annotate(
            total_stock=Coalesce(Sum("batches__stock_quantity", filter=usable), 0),
            min_price=Min("batches__unit_price", filter=usable),
            max_price=Max("batches__unit_price", filter=usable),
            nearest_expiry=Min("batches__expires_on", filter=usable),
            stock_value=Coalesce(
                Sum(ExpressionWrapper(F("batches__stock_quantity") * F("batches__unit_price"), output_field=money), filter=usable),
                Value(Decimal("0")), output_field=money),
            expired_quantity=Coalesce(Sum("batches__stock_quantity", filter=Q(batches__expires_on__lte=today)), 0),
        )
        # Optional filter: low stock, expiring soon, or holding expired batches.
        flt = self.request.query_params.get("filter", "")
        if flt == "low":
            qs = qs.filter(total_stock__lt=LOW_STOCK_THRESHOLD)
        elif flt == "expiring":
            qs = qs.filter(nearest_expiry__lte=today + timedelta(days=EXPIRY_WARNING_DAYS))
        elif flt == "expired":
            qs = qs.filter(expired_quantity__gt=0)
        return qs.order_by("name")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        patient = self.request.query_params.get("patient", "")
        keywords = []
        if patient.isdigit():
            keywords = list(Allergy.objects.filter(patients__pk=int(patient)).exclude(ingredient_keyword="").values_list("ingredient_keyword", flat=True))
        context["allergy_keywords"] = keywords
        return context
