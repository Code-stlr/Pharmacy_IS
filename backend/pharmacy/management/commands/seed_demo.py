from datetime import date, timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from pharmacy.models import Category, Patient, Doctor, Supplier, Medication, DrugBatch, Prescription, PrescriptionLine


class Command(BaseCommand):
    help = "Create fictional demo data once; reruns preserve existing records. Does not create accounts."

    @transaction.atomic
    def handle(self, *args, **options):
        today = timezone.localdate()
        category, _ = Category.objects.get_or_create(name="Demo medicines")
        patient, _ = Patient.objects.get_or_create(reference="DEMO-P001", defaults={"full_name": "Demo Patient One", "date_of_birth": date(2000, 1, 1), "allergy_notes": ""})
        doctor, _ = Doctor.objects.get_or_create(license_number="DEMO-DOCTOR-001", defaults={"full_name": "Demo Doctor"})
        supplier, _ = Supplier.objects.get_or_create(name="Demo Supplier")
        medication, _ = Medication.objects.get_or_create(name="Demo Prescription Medicine", strength="10 mg", dosage_form="tablet", defaults={"category": category, "active_ingredient": "Fictional ingredient A", "unit": "tablet", "requires_prescription": True})
        otc, _ = Medication.objects.get_or_create(name="Demo OTC Medicine", strength="5 mg", dosage_form="tablet", defaults={"category": category, "active_ingredient": "Fictional ingredient B", "unit": "tablet", "requires_prescription": False})
        for medicine in [medication, otc]:
            DrugBatch.objects.get_or_create(medication=medicine, lot_number="DEMO-LOT-001", defaults={"supplier": supplier, "received_on": today, "expires_on": today + timedelta(days=365), "stock_quantity": 100, "unit_price": Decimal("25.00")})
        prescription, _ = Prescription.objects.get_or_create(reference="DEMO-RX001", defaults={"patient": patient, "doctor": doctor, "issued_on": today, "valid_until": today + timedelta(days=30)})
        if prescription.patient_id != patient.id:
            raise CommandError("Demo reference belongs to another patient; no data was changed.")
        PrescriptionLine.objects.get_or_create(prescription=prescription, medication=medication, defaults={"quantity_prescribed": 20, "directions": "Fictional demonstration instructions; not clinical guidance."})
        self.stdout.write(self.style.SUCCESS("Demo records ready. Existing data and stock were preserved."))
