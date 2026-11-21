from uuid import uuid4
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from .models import Branch, DrugBatch, Patient, PatientAccessLog, Prescription, PrescriptionLine, DispensingTransaction


def fail(code):
    raise ValidationError({"code": code})


@transaction.atomic
def dispense(*, patient, batch, prescription_line, quantity, pharmacist, branch):
    today = timezone.localdate()
    # Serialize allergy edits with dispensing for the shared patient across branches.
    patient = Patient.objects.select_for_update(no_key=True).filter(pk=patient.pk).first()
    if patient is None:
        fail("invalid_patient")
    # Lock the prescription before batches so different lines share one completion lock.
    line = None
    prescription = None
    if prescription_line:
        prescription = Prescription.objects.select_for_update().filter(pk=prescription_line.prescription_id).first()
        line = PrescriptionLine.objects.select_for_update().filter(pk=prescription_line.pk).first()
        if prescription is None or line is None:
            fail("invalid_prescription")
        if prescription.patient_id != patient.pk:
            fail("patient_mismatch")
        if prescription.status != Prescription.Status.ACTIVE or not prescription.issued_on <= today <= prescription.valid_until:
            fail("invalid_prescription")
        already = line.dispensings.aggregate(total=Sum("quantity"))["total"] or 0
        if already + quantity > line.quantity_prescribed:
            fail("prescription_limit")
    batch = DrugBatch.objects.select_for_update(of=("self",)).select_related("medication").filter(pk=batch.pk).first()
    if batch is None:
        fail("invalid_batch")
    if batch.branch_id != branch.pk:
        fail("branch_mismatch")
    if not Branch.objects.filter(pk=branch.pk, is_active=True).exists():
        fail("branch_unavailable")
    if not batch.medication.is_active or batch.expires_on <= today or batch.received_on > today:
        fail("invalid_batch")
    ingredient = batch.medication.active_ingredient.lower()
    if any(k.lower() in ingredient for k in patient.allergies.exclude(ingredient_keyword="").values_list("ingredient_keyword", flat=True)):
        fail("allergy_conflict")
    if line and line.medication_id != batch.medication_id:
        fail("medication_mismatch")
    if batch.medication.requires_prescription and not line:
        fail("prescription_required")
    if quantity < 1 or quantity > batch.stock_quantity:
        fail("insufficient_stock")
    result = DispensingTransaction.objects.create(reference=str(uuid4()), patient=patient, pharmacist=pharmacist, batch=batch,
        prescription_line=line, quantity=quantity, unit_price=batch.unit_price)
    batch.stock_quantity -= quantity
    batch.save(update_fields=["stock_quantity"])
    PatientAccessLog.objects.create(patient=patient, actor=pharmacist, branch=branch, action="dispense")
    if prescription:
        complete = all((item.dispensings.aggregate(total=Sum("quantity"))["total"] or 0) >= item.quantity_prescribed for item in prescription.lines.all())
        if complete:
            prescription.status = Prescription.Status.COMPLETED
            prescription.save(update_fields=["status"])
    return result
