from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from datetime import timedelta
from django.db.models import Sum
from django.utils import timezone
from rest_framework import serializers
from .models import Allergy, Branch, MAIN_BRANCH_CODE, Category, Supplier, Doctor, Patient, Medication, DrugBatch, Prescription, PrescriptionLine, DispensingTransaction


class ValidatedModelSerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        instance = self.instance or self.Meta.model()
        for key, value in attrs.items():
            setattr(instance, key, value)
        try:
            instance.full_clean()
        except DjangoValidationError:
            raise serializers.ValidationError({"code": "invalid_record"})
        return attrs


class BranchSerializer(ValidatedModelSerializer):
    class Meta:
        model = Branch
        fields = ["id", "code", "name", "is_active"]

    def validate_code(self, value):
        if self.instance and self.instance.code == MAIN_BRANCH_CODE and value != MAIN_BRANCH_CODE:
            raise serializers.ValidationError("The Main Branch code is reserved.")
        return value


class CategorySerializer(ValidatedModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


class SupplierSerializer(ValidatedModelSerializer):
    class Meta:
        model = Supplier
        fields = "__all__"


class DoctorSerializer(ValidatedModelSerializer):
    class Meta:
        model = Doctor
        fields = "__all__"


class AllergySerializer(ValidatedModelSerializer):
    class Meta:
        model = Allergy
        fields = "__all__"


class PatientSerializer(ValidatedModelSerializer):
    allergy_names = serializers.SlugRelatedField(source="allergies", many=True, read_only=True, slug_field="name")
    preferred_branch = serializers.PrimaryKeyRelatedField(queryset=Branch.objects.filter(is_active=True), required=False, allow_null=True)

    class Meta:
        model = Patient
        fields = "__all__"
        read_only_fields = ["user"]

    def validate(self, attrs):
        # Many-to-many values cannot be assigned directly on the model instance during full_clean().
        allergies = attrs.pop("allergies", None)
        super().validate(attrs)
        if allergies is not None:
            attrs["allergies"] = allergies
        return attrs


class MedicationSerializer(ValidatedModelSerializer):
    class Meta:
        model = Medication
        fields = "__all__"


class BatchSerializer(ValidatedModelSerializer):
    medication_name = serializers.CharField(source="medication.name", read_only=True)
    class Meta:
        model = DrugBatch
        fields = "__all__"
        read_only_fields = ["branch"]

    def validate(self, attrs):
        branch = self.context.get("operating_branch")
        if branch is None:
            raise serializers.ValidationError({"code": "branch_required"})
        return super().validate(attrs | {"branch": branch})


LOW_STOCK_THRESHOLD = 20
EXPIRY_WARNING_DAYS = 30


class StockSerializer(serializers.ModelSerializer):
    total_stock = serializers.IntegerField(read_only=True)
    min_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True, allow_null=True)
    max_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True, allow_null=True)
    nearest_expiry = serializers.DateField(read_only=True, allow_null=True)
    stock_value = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    expired_quantity = serializers.IntegerField(read_only=True)
    batches = serializers.SerializerMethodField()
    unsafe_for_patient = serializers.SerializerMethodField()

    class Meta:
        model = Medication
        fields = ["id", "name", "strength", "dosage_form", "active_ingredient", "requires_prescription",
                  "total_stock", "min_price", "max_price", "nearest_expiry", "stock_value", "expired_quantity",
                  "batches", "unsafe_for_patient"]

    def get_batches(self, obj) -> list:
        today = timezone.localdate()
        soon = today + timedelta(days=EXPIRY_WARNING_DAYS)
        result = []
        for batch in obj.branch_batches:
            if batch.received_on > today:
                status = "pending"
            elif batch.expires_on <= today:
                status = "expired"
            elif batch.stock_quantity == 0:
                status = "empty"
            elif batch.expires_on <= soon:
                status = "expiring"
            else:
                status = "ok"
            result.append({"id": batch.id, "lot_number": batch.lot_number, "stock_quantity": batch.stock_quantity,
                           "unit_price": str(batch.unit_price), "received_on": batch.received_on.isoformat(),
                           "expires_on": batch.expires_on.isoformat(), "status": status})
        return result

    def get_unsafe_for_patient(self, obj) -> bool:
        return any(k.lower() in obj.active_ingredient.lower() for k in self.context.get("allergy_keywords", []) if k)


class LineSerializer(ValidatedModelSerializer):
    remaining = serializers.SerializerMethodField()
    medication_name = serializers.CharField(source="medication.name", read_only=True)
    def get_remaining(self, obj) -> int:
        return obj.quantity_prescribed - (obj.dispensings.aggregate(total=Sum("quantity"))["total"] or 0)
    def validate(self, attrs):
        # The parent prescription is attached inside the atomic create operation.
        if attrs["quantity_prescribed"] <= 0:
            raise serializers.ValidationError({"code": "invalid_record"})
        return attrs
    class Meta:
        model = PrescriptionLine
        exclude = ["prescription"]


class PrescriptionSerializer(ValidatedModelSerializer):
    lines = LineSerializer(many=True, allow_empty=False)
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    class Meta:
        model = Prescription
        fields = "__all__"
        read_only_fields = ["status"]

    def validate(self, attrs):
        lines = attrs.pop("lines")
        super().validate(attrs)
        if len({line["medication"].pk for line in lines}) != len(lines):
            raise serializers.ValidationError({"code": "duplicate_medication"})
        attrs["lines"] = lines
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        lines = validated_data.pop("lines")
        prescription = Prescription.objects.create(**validated_data)
        for line in lines:
            PrescriptionLine.objects.create(prescription=prescription, **line)
        return prescription


class DispensingSerializer(serializers.ModelSerializer):
    medication_name = serializers.CharField(source="batch.medication.name", read_only=True)
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    branch = serializers.IntegerField(source="batch.branch_id", read_only=True)
    branch_name = serializers.CharField(source="batch.branch.name", read_only=True)
    batch = serializers.PrimaryKeyRelatedField(queryset=DrugBatch.objects.none())
    class Meta:
        model = DispensingTransaction
        fields = "__all__"
        read_only_fields = ["reference", "pharmacist", "unit_price", "dispensed_at"]
    quantity = serializers.IntegerField(min_value=1)

    def get_fields(self):
        fields = super().get_fields()
        branch = self.context.get("operating_branch")
        if branch is not None:
            fields["batch"].queryset = DrugBatch.objects.filter(branch=branch)
        return fields
