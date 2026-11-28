from django.db import IntegrityError, transaction
from datetime import timedelta
from decimal import Decimal
from django.db.models import DecimalField, ExpressionWrapper, F, Min, Max, Prefetch, Sum, Q, Value
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import viewsets, mixins
from rest_framework.filters import SearchFilter
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import AllowAny, BasePermission, SAFE_METHODS
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from .branches import audit_patient, operating_branch, role
from .models import Allergy, Branch, Category, Supplier, Doctor, Patient, Medication, DrugBatch, Prescription, DispensingTransaction
from .serializers import LOW_STOCK_THRESHOLD, EXPIRY_WARNING_DAYS, AllergySerializer, BranchSerializer, StockSerializer, CategorySerializer, SupplierSerializer, DoctorSerializer, PatientSerializer, MedicationSerializer, BatchSerializer, PrescriptionSerializer, DispensingSerializer
from .services import dispense


class DomainPermission(BasePermission):
    def has_permission(self, request, view):
        current = role(request.user)
        allowed = request.user.is_active and (current in ("Admin", "Pharmacist") or (current == "Patient" and request.method in SAFE_METHODS))
        if allowed:
            request.operating_branch = operating_branch(request, current)
        return allowed


class BranchListViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = Branch.objects.filter(is_active=True).order_by("name", "pk")
    serializer_class = BranchSerializer
    permission_classes = [AllowAny]
    authentication_classes = []


def patient_subject(record):
    if isinstance(record, Patient):
        return record
    if isinstance(record, (Prescription, DispensingTransaction)):
        return record.patient
    return None


def query_id_from(request, parameter):
    supplied = request.query_params.get(parameter)
    if supplied is None:
        return None
    if not supplied.isascii() or not supplied.isdecimal() or len(supplied) > 19 or not 0 < int(supplied) <= 2**63 - 1:
        raise ValidationError({"code": f"invalid_{parameter}"})
    return int(supplied)


def audit_patient_query(request):
    if getattr(request, "operating_branch", None) and request.method == "GET":
        patient_id = query_id_from(request, "patient")
        if patient_id is not None:
            patient = Patient.objects.filter(pk=patient_id).first()
            if patient is not None:
                audit_patient(request, patient, "read")


class ResourceViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    permission_classes = [DomainPermission]
    filter_backends = [SearchFilter]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        qs = super().get_queryset()
        if getattr(self, "swagger_fake_view", False) or self.request is None:
            return qs.none()
        if role(self.request.user) == "Patient":
            if qs.model == Patient:
                return qs.filter(user=self.request.user)
            if qs.model in [Prescription, DispensingTransaction]:
                return qs.filter(patient__user=self.request.user)
            return qs.none()
        return qs

    def get_serializer_context(self):
        return super().get_serializer_context() | {"operating_branch": getattr(self.request, "operating_branch", None)}

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        data = self.get_serializer(instance).data
        patient = patient_subject(instance)
        if patient is not None:
            audit_patient(request, patient, "read")
        return Response(data)

    def perform_create(self, serializer):
        try:
            with transaction.atomic():
                instance = serializer.save()
                patient = patient_subject(instance)
                if patient is not None:
                    action = "prescribe" if isinstance(instance, Prescription) else "create"
                    audit_patient(self.request, patient, action)
        except IntegrityError:
            raise ValidationError({"code": "conflict"})

    def perform_update(self, serializer):
        try:
            with transaction.atomic():
                # Serialize patient allergy edits with the dispensing service.
                locked = get_object_or_404(self.get_queryset().select_for_update(no_key=True), pk=serializer.instance.pk)
                serializer.instance = locked
                instance = serializer.save()
                patient = patient_subject(instance)
                if patient is not None:
                    audit_patient(self.request, patient, "update")
        except IntegrityError:
            raise ValidationError({"code": "conflict"})


class PatientViewSet(ResourceViewSet):
    queryset = Patient.objects.all().order_by("reference")
    serializer_class = PatientSerializer
    search_fields = ["reference", "full_name", "phone"]

    def get_queryset(self):
        qs = super().get_queryset()
        reference = self.request.query_params.get("reference") if self.request else None
        if reference is not None:
            qs = qs.filter(reference=reference)
        if self.request is None or getattr(self, "action", None) != "list":
            return qs
        if self.request.query_params.get("preferred_branch") == "unassigned":
            return qs.filter(preferred_branch__isnull=True)
        branch_id = query_id_from(self.request, "preferred_branch")
        return qs.filter(preferred_branch_id=branch_id) if branch_id is not None else qs

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        if "reference" in request.query_params:
            patient = self.filter_queryset(self.get_queryset()).first()
            if patient is not None:
                audit_patient(request, patient, "read")
        return response


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

    def get_queryset(self):
        return super().get_queryset().filter(branch=getattr(self.request, "operating_branch", None))

    @transaction.atomic
    def perform_create(self, serializer):
        branch = Branch.objects.select_for_update(no_key=True).get(pk=self.request.operating_branch.pk)
        if not branch.is_active:
            raise ValidationError({"code": "branch_unavailable"})
        super().perform_create(serializer)


class PatientHistoryViewSet(ResourceViewSet):
    def get_queryset(self):
        qs = super().get_queryset()
        patient_id = query_id_from(self.request, "patient") if self.request else None
        return qs.filter(patient_id=patient_id) if patient_id is not None else qs

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        audit_patient_query(request)
        return response


class PrescriptionViewSet(PatientHistoryViewSet):
    queryset = Prescription.objects.select_related("patient").prefetch_related("lines__medication").order_by("-issued_on", "-id")
    serializer_class = PrescriptionSerializer
    search_fields = ["reference", "patient__full_name", "lines__medication__name"]
    http_method_names = ["get", "post", "head", "options"]


class DispensingViewSet(PatientHistoryViewSet):
    queryset = DispensingTransaction.objects.select_related("patient", "batch__medication", "batch__branch").order_by("-dispensed_at")
    serializer_class = DispensingSerializer
    search_fields = ["reference", "patient__full_name", "batch__medication__name"]
    http_method_names = ["get", "post", "head", "options"]

    def perform_create(self, serializer):
        try:
            serializer.instance = dispense(
                **serializer.validated_data,
                pharmacist=self.request.user,
                branch=self.request.operating_branch,
            )
        except IntegrityError:
            raise ValidationError({"code": "conflict"})


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
        branch = getattr(self.request, "operating_branch", None)
        if branch is None:
            return Medication.objects.none()
        today = timezone.localdate()
        same_branch = Q(batches__branch=branch)
        usable = same_branch & Q(batches__received_on__lte=today, batches__expires_on__gt=today, batches__stock_quantity__gt=0)
        money = DecimalField(max_digits=14, decimal_places=2)
        scoped_batches = Prefetch("batches", queryset=DrugBatch.objects.filter(branch=branch).order_by("expires_on", "pk"), to_attr="branch_batches")
        qs = Medication.objects.filter(is_active=True).prefetch_related(scoped_batches).annotate(
            total_stock=Coalesce(Sum("batches__stock_quantity", filter=usable), 0),
            min_price=Min("batches__unit_price", filter=usable),
            max_price=Max("batches__unit_price", filter=usable),
            nearest_expiry=Min("batches__expires_on", filter=usable),
            stock_value=Coalesce(
                Sum(ExpressionWrapper(F("batches__stock_quantity") * F("batches__unit_price"), output_field=money), filter=usable),
                Value(Decimal("0")), output_field=money),
            expired_quantity=Coalesce(Sum("batches__stock_quantity", filter=same_branch & Q(batches__expires_on__lte=today)), 0),
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
        keywords = []
        if context["operating_branch"] is not None:
            patient_id = query_id_from(self.request, "patient")
            keywords = list(Allergy.objects.filter(patients__pk=patient_id).exclude(ingredient_keyword="").values_list("ingredient_keyword", flat=True)) if patient_id else []
        context["allergy_keywords"] = keywords
        return context

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        audit_patient_query(request)
        return response

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        audit_patient_query(request)
        return response
