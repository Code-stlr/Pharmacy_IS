from datetime import timedelta
from io import StringIO

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.cache import cache
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from .models import Allergy, Branch, DispensingTransaction, DrugBatch, Patient, PatientAccessLog, PrescriptionLine, UserBranch


class BranchTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_demo", stdout=StringIO())
        cls.main = Branch.objects.get(code="MAIN")
        cls.east = Branch.objects.create(code="EAST", name="East Branch")
        cls.closed = Branch.objects.create(code="CLOSED", name="Closed Branch", is_active=False)
        cls.main_staff = cls.create_user("main_staff", "Pharmacist", cls.main)
        cls.east_staff = cls.create_user("east_staff", "Pharmacist", cls.east)
        cls.admin = cls.create_user("branch_admin", "Admin")
        cls.patient = Patient.objects.get(reference="DEMO-P001")
        cls.patient_user = cls.create_user("shared_patient", "Patient")
        cls.patient.user = cls.patient_user
        cls.patient.save(update_fields=["user"])
        cls.main_batch = DrugBatch.objects.get(medication__requires_prescription=True)
        cls.east_batch = DrugBatch.objects.create(
            branch=cls.east, medication=cls.main_batch.medication, supplier=cls.main_batch.supplier,
            lot_number=cls.main_batch.lot_number, received_on=cls.main_batch.received_on,
            expires_on=cls.main_batch.expires_on, stock_quantity=65, unit_price="30.00",
        )
        cls.line = PrescriptionLine.objects.get()

    @staticmethod
    def create_user(username, role, branch=None):
        user = get_user_model().objects.create_user(username=username, password="Branch-test-5938!")
        user.groups.add(Group.objects.get_or_create(name=role)[0])
        if branch:
            UserBranch.objects.create(user=user, branch=branch)
        return user

    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def dispense(self, batch, quantity):
        return self.client.post(
            "/api/dispensings/",
            {"patient": self.patient.pk, "batch": batch.pk, "prescription_line": self.line.pk, "quantity": quantity},
            format="json",
        )

    def test_shared_patient_allergies_and_prescription_across_dispensings(self):
        allergy = Allergy.objects.create(name="Fictional allergy note", ingredient_keyword="")
        self.client.force_authenticate(self.main_staff)
        updated = self.client.patch(f"/api/patients/{self.patient.pk}/", {"allergies": [allergy.pk]}, format="json")
        self.assertEqual(updated.status_code, 200, updated.data)
        first_fill = self.dispense(self.main_batch, 5)
        self.assertEqual(first_fill.status_code, 201, first_fill.data)

        self.client.force_authenticate(self.east_staff)
        patients = self.client.get("/api/patients/", {"reference": self.patient.reference}).json()
        self.assertEqual([record["id"] for record in patients], [self.patient.pk])
        patient = self.client.get(f"/api/patients/{self.patient.pk}/").json()
        self.assertIn(allergy.pk, patient["allergies"])
        history = self.client.get("/api/dispensings/", {"patient": self.patient.pk}).json()
        self.assertEqual(history[0]["branch_name"], self.main.name)
        prescriptions = self.client.get("/api/prescriptions/", {"patient": self.patient.pk}).json()
        self.assertEqual(prescriptions[0]["lines"][0]["remaining"], 15)

        self.assertEqual(self.dispense(self.main_batch, 1).status_code, 400)
        limit = self.dispense(self.east_batch, 16)
        self.assertEqual(limit.status_code, 400)
        self.assertEqual(limit.data["code"], "prescription_limit")
        second_fill = self.dispense(self.east_batch, 15)
        self.assertEqual(second_fill.status_code, 201, second_fill.data)
        self.assertEqual(second_fill.data["branch"], self.east.pk)
        self.main_batch.refresh_from_db()
        self.east_batch.refresh_from_db()
        self.assertEqual(self.main_batch.stock_quantity, 95)
        self.assertEqual(self.east_batch.stock_quantity, 50)
        self.line.prescription.refresh_from_db()
        self.assertEqual(self.line.prescription.status, "completed")
        self.assertEqual(DispensingTransaction.objects.count(), 2)

        self.client.force_authenticate(self.patient_user)
        self.assertCountEqual(
            [entry["branch_name"] for entry in self.client.get("/api/dispensings/").json()],
            [self.main.name, self.east.name],
        )
        self.assertTrue(PatientAccessLog.objects.filter(
            patient=self.patient, actor=self.main_staff, branch=self.main, action=PatientAccessLog.Action.UPDATE,
        ).exists())
        self.assertTrue(PatientAccessLog.objects.filter(
            patient=self.patient, actor=self.east_staff, branch=self.east, action=PatientAccessLog.Action.READ,
        ).exists())

    def test_stock_totals_lists_and_details_are_branch_local(self):
        self.client.force_authenticate(self.east_staff)
        self.assertEqual(self.client.get(f"/api/batches/{self.main_batch.pk}/").status_code, 404)
        self.assertEqual([batch["id"] for batch in self.client.get("/api/batches/").json()], [self.east_batch.pk])
        medication = self.client.get(f"/api/stock/{self.east_batch.medication_id}/").json()
        self.assertEqual(medication["total_stock"], 65)
        self.assertEqual(medication["stock_value"], "1950.00")
        self.assertEqual([batch["id"] for batch in medication["batches"]], [self.east_batch.pk])
        spoof = self.client.get("/api/batches/", HTTP_X_PHARMACY_BRANCH=str(self.main.pk))
        self.assertEqual(spoof.status_code, 403)
        self.assertEqual(spoof.data["code"], "branch_mismatch")
        self.assertEqual(self.client.post("/api/auth/branch/", {"branch": self.main.pk}, format="json").status_code, 403)

    def test_allergy_recorded_at_another_branch_blocks_the_fill(self):
        allergy = Allergy.objects.create(name="Fictional ingredient A allergy", ingredient_keyword="ingredient A")
        self.client.force_authenticate(self.main_staff)
        response = self.client.patch(f"/api/patients/{self.patient.pk}/", {"allergies": [allergy.pk]}, format="json")
        self.assertEqual(response.status_code, 200, response.data)

        self.client.force_authenticate(self.east_staff)
        response = self.dispense(self.east_batch, 1)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "allergy_conflict")
        self.east_batch.refresh_from_db()
        self.assertEqual(self.east_batch.stock_quantity, 65)
        self.assertFalse(DispensingTransaction.objects.exists())

    def test_future_receipts_do_not_contribute_to_available_stock(self):
        DrugBatch.objects.filter(pk=self.east_batch.pk).update(received_on=timezone.localdate() + timedelta(days=1))
        self.client.force_authenticate(self.east_staff)
        medication = self.client.get(f"/api/stock/{self.east_batch.medication_id}/").json()
        self.assertEqual(medication["total_stock"], 0)
        self.assertIsNone(medication["min_price"])
        self.assertEqual(medication["batches"][0]["status"], "pending")
        self.assertEqual(self.dispense(self.east_batch, 1).data["code"], "invalid_batch")

    def test_login_routes_automatically_and_inactive_branches_are_excluded(self):
        locations = self.client.get("/api/branches/").json()
        self.assertCountEqual([branch["id"] for branch in locations], [self.main.pk, self.east.pk])
        password = "Branch-test-5938!"
        login = self.client.post("/api/auth/login/", {"username": self.east_staff.username, "password": password}, format="json")
        self.assertEqual(login.status_code, 200, login.data)
        self.assertEqual(login.data["active_branch"]["id"], self.east.pk)
        self.client.post("/api/auth/logout/")
        registration = {
            "username": "new_branch_patient", "password": password,
            "full_name": "Branch Test Patient", "date_of_birth": "2000-01-01",
        }
        rejected = self.client.post("/api/auth/register/", registration | {"preferred_branch": self.closed.pk}, format="json")
        self.assertEqual(rejected.status_code, 400, rejected.data)
        created = self.client.post("/api/auth/register/", registration | {"preferred_branch": self.east.pk}, format="json")
        self.assertEqual(created.status_code, 201, created.data)
        self.assertEqual(created.data["active_branch"]["id"], self.east.pk)
        self.assertEqual(Patient.objects.get(user__username=registration["username"]).preferred_branch_id, self.east.pk)

    def test_admin_context_switch_and_branch_assignment(self):
        login = self.client.post(
            "/api/auth/login/", {"username": self.admin.username, "password": "Branch-test-5938!"}, format="json",
        )
        self.assertEqual(login.data["active_branch"]["id"], self.main.pk)
        switched = self.client.post("/api/auth/branch/", {"branch": self.east.pk}, format="json")
        self.assertEqual(switched.status_code, 200, switched.data)
        self.assertEqual(switched.data["active_branch"]["id"], self.east.pk)
        self.assertEqual(self.client.get("/api/auth/me/").data["active_branch"]["id"], self.east.pk)
        self.assertEqual([batch["id"] for batch in self.client.get("/api/batches/").json()], [self.east_batch.pk])
        main_tab = self.client.get("/api/batches/", HTTP_X_PHARMACY_BRANCH=str(self.main.pk)).json()
        self.assertIn(self.main_batch.pk, [batch["id"] for batch in main_tab])
        self.assertNotIn(self.east_batch.pk, [batch["id"] for batch in main_tab])

        created = self.client.post("/api/admin/users/", {
            "username": "new_east_staff", "password": "Branch-staff-5829!", "role": "Pharmacist", "branch": self.east.pk,
        }, format="json")
        self.assertEqual(created.status_code, 201, created.data)
        self.assertEqual(UserBranch.objects.get(user_id=created.data["id"]).branch_id, self.east.pk)
        deactivation = self.client.patch(f"/api/admin/branches/{self.east.pk}/", {"is_active": False}, format="json")
        self.assertIn(deactivation.status_code, [400, 409])
        self.east.refresh_from_db()
        self.assertTrue(self.east.is_active)

    def test_unassigned_pharmacist_cannot_use_shared_records_or_inventory(self):
        self.client.force_authenticate(self.create_user("unassigned_staff", "Pharmacist"))
        for endpoint in ["/api/patients/", "/api/prescriptions/", "/api/batches/", "/api/stock/", "/api/dispensings/"]:
            with self.subTest(endpoint=endpoint):
                self.assertEqual(self.client.get(endpoint).status_code, 403)

    def test_reassignment_invalidates_the_pharmacists_previous_workspace(self):
        login = self.client.post("/api/auth/login/", {
            "username": self.main_staff.username, "password": "Branch-test-5938!",
        }, format="json")
        self.assertEqual(login.data["active_branch"]["id"], self.main.pk)
        UserBranch.objects.filter(user=self.main_staff).update(branch=self.east)
        stale = self.client.get("/api/batches/", HTTP_X_PHARMACY_BRANCH=str(self.main.pk))
        self.assertEqual(stale.status_code, 403)
        self.assertEqual(self.client.get("/api/auth/me/").data["active_branch"]["id"], self.east.pk)
