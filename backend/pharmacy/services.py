from uuid import uuid4
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from .models import DrugBatch, Prescription, PrescriptionLine, DispensingTransaction


def fail(code):
    raise ValidationError({"code": code})


@transaction.atomic
def dispense(*, patient, batch, prescription_line, quantity, pharmacist):
    today = timezone.localdate()
    # Lock the prescription before batches so different lines share one completion lock.
    line = None
    prescription = None
    if prescription_line:
        prescription = Prescription.objects.select_for_update().get(pk=prescription_line.prescription_id)
        line = PrescriptionLine.objects.select_for_update().get(pk=prescription_line.pk)
        if prescription.patient_id != patient.pk:
            fail("patient_mismatch")
        if prescription.status != Prescription.Status.ACTIVE or not prescription.issued_on <= today <= prescription.valid_until:
            fail("invalid_prescription")
        already = line.dispensings.aggregate(total=Sum("quantity"))["total"] or 0
        if already + quantity > line.quantity_prescribed:
            fail("prescription_limit")
    batch = DrugBatch.objects.select_for_update().select_related("medication").get(pk=batch.pk)
    if not batch.medication.is_active or batch.expires_on <= today or batch.received_on > today:
        fail("invalid_batch")
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
    if prescription:
        complete = all((item.dispensings.aggregate(total=Sum("quantity"))["total"] or 0) >= item.quantity_prescribed for item in prescription.lines.all())
        if complete:
            prescription.status = Prescription.Status.COMPLETED
            prescription.save(update_fields=["status"])
    return result
