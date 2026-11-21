from datetime import date, timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from pharmacy.models import MAIN_BRANCH_CODE, Allergy, Branch, Category, Patient, Doctor, Supplier, Medication, DrugBatch, Prescription, PrescriptionLine
from pharmacy.services import dispense


class Command(BaseCommand):
    help = "Create fictional demo data once; reruns preserve existing records. Does not create sign-in accounts."

    def add_arguments(self, parser):
        parser.add_argument("--full", action="store_true", help="Include 103 fictional patients and 102 dispensing events.")

    @transaction.atomic
    def handle(self, *args, **options):
        today = timezone.localdate()
        main, _ = Branch.objects.get_or_create(code=MAIN_BRANCH_CODE, defaults={"name": "Main Branch"})
        category, _ = Category.objects.get_or_create(name="Demo medicines")
        patient, _ = Patient.objects.get_or_create(reference="DEMO-P001", defaults={"full_name": "Demo Patient One", "date_of_birth": date(2000, 1, 1), "allergy_notes": "", "preferred_branch": main})
        for name, keyword in [("Penicillin", "penicillin"), ("Aspirin", "acetylsalicylic"), ("Ibuprofen", "ibuprofen"), ("Lactose", "lactose"), ("Sulfonamides", "sulfa")]:
            Allergy.objects.get_or_create(name=name, defaults={"ingredient_keyword": keyword})
        doctor, _ = Doctor.objects.get_or_create(license_number="DEMO-DOCTOR-001", defaults={"full_name": "Demo Doctor"})
        supplier, _ = Supplier.objects.get_or_create(name="Demo Supplier")
        medication, _ = Medication.objects.get_or_create(name="Demo Prescription Medicine", strength="10 mg", dosage_form="tablet", defaults={"category": category, "active_ingredient": "Fictional ingredient A", "unit": "tablet", "requires_prescription": True})
        otc, _ = Medication.objects.get_or_create(name="Demo OTC Medicine", strength="5 mg", dosage_form="tablet", defaults={"category": category, "active_ingredient": "Fictional ingredient B", "unit": "tablet", "requires_prescription": False})
        for medicine in [medication, otc]:
            DrugBatch.objects.get_or_create(branch=main, medication=medicine, lot_number="DEMO-LOT-001", defaults={"supplier": supplier, "received_on": today, "expires_on": today + timedelta(days=365), "stock_quantity": 100, "unit_price": Decimal("25.00")})
        prescription, _ = Prescription.objects.get_or_create(reference="DEMO-RX001", defaults={"patient": patient, "doctor": doctor, "issued_on": today, "valid_until": today + timedelta(days=30)})
        if prescription.patient_id != patient.id:
            raise CommandError("Demo reference belongs to another patient; no data was changed.")
        PrescriptionLine.objects.get_or_create(prescription=prescription, medication=medication, defaults={"quantity_prescribed": 20, "directions": "Fictional demonstration instructions; not clinical guidance."})
        if options["full"]:
            self.seed_full_demo(today, main, category, doctor, supplier)
        self.stdout.write(self.style.SUCCESS("Demo records ready. Existing data and stock were preserved."))

    def seed_full_demo(self, today, branch, category, doctor, supplier):
        # Generate synthetic records from scratch; no source database or dump is read.
        actor, _ = get_user_model().objects.get_or_create(
            username="showcase_history",
            defaults={"is_active": False, "password": make_password(None)},
        )
        if actor.is_active or actor.has_usable_password():
            raise CommandError("The showcase history account must be inactive and unable to sign in.")

        allergy = Allergy.objects.get(name="Aspirin")
        medicines = []
        for number in range(1, 26):
            medicine, _ = Medication.objects.get_or_create(
                name=f"Showcase Medicine {number:02d}",
                strength="10 mg",
                dosage_form="tablet",
                defaults={
                    "category": category,
                    "active_ingredient": "acetylsalicylic" if number == 25 else f"Fictional ingredient {number:02d}",
                    "unit": "tablet",
                    "requires_prescription": number % 5 != 0,
                },
            )
            medicines.append(medicine)

        DrugBatch.objects.get_or_create(
            branch=branch,
            medication=medicines[0],
            lot_number="SHOWCASE-EXPIRED",
            defaults={
                "supplier": supplier, "received_on": today - timedelta(days=120),
                "expires_on": today - timedelta(days=1), "stock_quantity": 12,
                "unit_price": Decimal("12.50"),
            },
        )
        for number in range(2, 105):
            patient, created = Patient.objects.get_or_create(
                reference=f"SHOWCASE-P{number:03d}",
                defaults={"full_name": f"Fictional Patient {number:03d}", "date_of_birth": date(1980 + number % 25, 1, 1), "preferred_branch": branch},
            )
            if not created:
                continue
            medicine_index = (number - 2) % len(medicines)
            medicine = medicines[medicine_index]
            batch = DrugBatch.objects.create(
                branch=branch, medication=medicine, supplier=supplier, lot_number=f"SHOWCASE-LOT-{number:03d}",
                received_on=today - timedelta(days=30),
                expires_on=today + timedelta(days=10 if medicine_index == 1 else 365),
                stock_quantity=4 if medicine_index == 2 else 40,
                unit_price=Decimal("12.50") + medicine_index,
            )
            if number % 8 == 0:
                patient.allergies.add(allergy)
            if number == 104:
                continue
            prescription = Prescription.objects.create(
                reference=f"SHOWCASE-RX{number:03d}", patient=patient, doctor=doctor,
                issued_on=today, valid_until=today + timedelta(days=30),
            )
            line = PrescriptionLine.objects.create(
                prescription=prescription, medication=medicine, quantity_prescribed=2,
                directions="Fictional demonstration instructions; not clinical guidance.",
            )
            dispense(
                patient=patient, batch=batch, prescription_line=line if medicine.requires_prescription else None,
                quantity=2, pharmacist=actor, branch=branch,
            )
