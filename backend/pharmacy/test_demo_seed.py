from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase

from pharmacy.models import Allergy, DispensingTransaction, DrugBatch, Medication, Patient, Prescription, UserBranch


class FullDemoSeedTests(TestCase):
    def test_shared_accounts_use_team_password_and_rerun_preserves_existing_accounts(self):
        call_command("seed_demo", stdout=StringIO())
        call_command("create_demo_users", shared_demo=True, stdout=StringIO())
        users = get_user_model().objects
        for username, group in [("admin_demo", "Admin"), ("pharmacist_demo", "Pharmacist"), ("patient_demo", "Patient")]:
            account = users.get(username=username)
            self.assertTrue(account.check_password("Demo-Pharmacy-2026!"))
            self.assertEqual(list(account.groups.values_list("name", flat=True)), [group])

        self.assertEqual(UserBranch.objects.get(user__username="pharmacist_demo").branch.code, "MAIN")
        self.assertEqual(Patient.objects.get(user__username="patient_demo").reference, "DEMO-P001")
        admin = users.get(username="admin_demo")
        admin.set_password("Different-local-demo-2026!")
        admin.save(update_fields=["password"])
        call_command("create_demo_users", shared_demo=True, stdout=StringIO())
        admin.refresh_from_db()
        self.assertTrue(admin.check_password("Different-local-demo-2026!"))
        self.assertEqual(users.count(), 3)

    def test_full_seed_has_fictional_workflows_and_preserves_stock_on_rerun(self):
        call_command("seed_demo", full=True, stdout=StringIO())

        self.assertEqual(Patient.objects.count(), 104)
        self.assertEqual(DispensingTransaction.objects.count(), 102)
        self.assertEqual(Prescription.objects.count(), 103)
        self.assertEqual(Medication.objects.count(), 27)
        self.assertEqual(DrugBatch.objects.count(), 106)
        self.assertEqual(Allergy.objects.count(), 5)
        self.assertTrue(Patient.objects.filter(allergies__name="Aspirin").exists())
        self.assertFalse(Patient.objects.exclude(phone="").exists())
        self.assertTrue(DispensingTransaction.objects.filter(prescription_line__isnull=True).exists())
        self.assertTrue(Prescription.objects.filter(status=Prescription.Status.COMPLETED).exists())

        actor = get_user_model().objects.get(username="showcase_history")
        self.assertFalse(actor.is_active)
        self.assertFalse(actor.has_usable_password())

        batch = DrugBatch.objects.get(lot_number="SHOWCASE-LOT-002")
        self.assertEqual(batch.stock_quantity, 38)
        batch.stock_quantity = 17
        batch.save(update_fields=["stock_quantity"])
        call_command("seed_demo", full=True, stdout=StringIO())
        batch.refresh_from_db()
        self.assertEqual(batch.stock_quantity, 17)
        self.assertEqual(DispensingTransaction.objects.count(), 102)
        self.assertEqual(Patient.objects.count(), 104)
