from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q, F
from django.utils import timezone


class Category(models.Model):
    name = models.CharField(max_length=120, unique=True)

    def __str__(self):
        return self.name


class Patient(models.Model):
    reference = models.CharField(max_length=32, unique=True)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    full_name = models.CharField(max_length=200)
    date_of_birth = models.DateField()
    phone = models.CharField(max_length=32, blank=True)
    allergy_notes = models.TextField(blank=True)

    def clean(self):
        if self.date_of_birth and self.date_of_birth > timezone.localdate():
            raise ValidationError({"date_of_birth": "Birth date cannot be in the future."})

    def __str__(self):
        return self.reference


class Doctor(models.Model):
    full_name = models.CharField(max_length=200)
    license_number = models.CharField(max_length=80, unique=True)


class Supplier(models.Model):
    name = models.CharField(max_length=200, unique=True)
    phone = models.CharField(max_length=32, blank=True)


class Medication(models.Model):
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="medications")
    name = models.CharField(max_length=200, db_index=True)
    active_ingredient = models.CharField(max_length=200)
    strength = models.CharField(max_length=80)
    dosage_form = models.CharField(max_length=80)
    unit = models.CharField(max_length=40, help_text="Dispensing unit, e.g. tablet or bottle.")
    requires_prescription = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["name", "strength", "dosage_form"], name="unique_medication_presentation")]

    def __str__(self):
        return f"{self.name} {self.strength}"


class DrugBatch(models.Model):
    medication = models.ForeignKey(Medication, on_delete=models.PROTECT, related_name="batches")
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name="batches")
    lot_number = models.CharField(max_length=80)
    received_on = models.DateField()
    expires_on = models.DateField(db_index=True)
    stock_quantity = models.PositiveIntegerField(default=0)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["medication", "lot_number"], name="unique_medication_lot"),
            models.CheckConstraint(condition=Q(stock_quantity__gte=0), name="batch_nonnegative_stock"),
            models.CheckConstraint(condition=Q(unit_price__gt=0), name="batch_positive_price"),
            models.CheckConstraint(condition=Q(expires_on__gt=F("received_on")), name="batch_valid_dates"),
        ]


class Prescription(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    reference = models.CharField(max_length=40, unique=True)
    patient = models.ForeignKey(Patient, on_delete=models.PROTECT, related_name="prescriptions")
    doctor = models.ForeignKey(Doctor, on_delete=models.PROTECT, related_name="prescriptions")
    issued_on = models.DateField()
    valid_until = models.DateField()
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.ACTIVE)

    class Meta:
        constraints = [
            models.CheckConstraint(condition=Q(valid_until__gte=F("issued_on")), name="prescription_valid_dates"),
            models.CheckConstraint(condition=Q(status__in=["active", "completed", "cancelled"]), name="prescription_valid_status"),
        ]


class PrescriptionLine(models.Model):
    prescription = models.ForeignKey(Prescription, on_delete=models.PROTECT, related_name="lines")
    medication = models.ForeignKey(Medication, on_delete=models.PROTECT, related_name="prescription_lines")
    quantity_prescribed = models.PositiveIntegerField()
    directions = models.TextField()

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["prescription", "medication"], name="unique_prescription_medication"),
            models.CheckConstraint(condition=Q(quantity_prescribed__gt=0), name="line_positive_quantity"),
        ]


class DispensingTransaction(models.Model):
    reference = models.CharField(max_length=40, unique=True)
    patient = models.ForeignKey(Patient, on_delete=models.PROTECT, related_name="dispensings")
    pharmacist = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="dispensings")
    batch = models.ForeignKey(DrugBatch, on_delete=models.PROTECT, related_name="dispensings")
    prescription_line = models.ForeignKey(PrescriptionLine, null=True, blank=True, on_delete=models.PROTECT, related_name="dispensings")
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    dispensed_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        constraints = [
            models.CheckConstraint(condition=Q(quantity__gt=0), name="dispensing_positive_quantity"),
            models.CheckConstraint(condition=Q(unit_price__gt=0), name="dispensing_positive_price"),
        ]

    def clean(self):
        if not self.batch_id:
            return
        if self.prescription_line_id:
            line = self.prescription_line
            if line.medication_id != self.batch.medication_id:
                raise ValidationError({"prescription_line": "Medication does not match the selected batch."})
            if line.prescription.patient_id != self.patient_id:
                raise ValidationError({"patient": "Patient does not match the prescription."})
        elif self.batch.medication.requires_prescription:
            raise ValidationError({"prescription_line": "This medication requires a prescription."})
