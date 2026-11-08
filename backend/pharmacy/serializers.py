from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.db.models import Sum
from rest_framework import serializers
from .models import Category, Supplier, Doctor, Patient, Medication, DrugBatch, Prescription, PrescriptionLine, DispensingTransaction


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


class PatientSerializer(ValidatedModelSerializer):
    class Meta:
        model = Patient
        fields = "__all__"
        read_only_fields = ["user"]


class MedicationSerializer(ValidatedModelSerializer):
    class Meta:
        model = Medication
        fields = "__all__"


class BatchSerializer(ValidatedModelSerializer):
    medication_name = serializers.CharField(source="medication.name", read_only=True)
    class Meta:
        model = DrugBatch
        fields = "__all__"


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
    class Meta:
        model = DispensingTransaction
        fields = "__all__"
        read_only_fields = ["reference", "pharmacist", "unit_price", "dispensed_at"]
    quantity = serializers.IntegerField(min_value=1)
