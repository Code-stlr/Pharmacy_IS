from decimal import Decimal
from io import StringIO
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError
from django.core.management import call_command, CommandError
from django.db import IntegrityError, transaction
from django.test import TestCase
from rest_framework.test import APIClient
from .management.commands.configure_branch_locations import LOCATIONS
from .models import Branch, Patient
from .serializers import BranchSerializer


class BranchLocationTests(TestCase):
    def setUp(self):
        self.main = Branch.objects.get(code="MAIN")
        for code in LOCATIONS:
            Branch.objects.get_or_create(code=code, defaults={"name": code})
        self.patient_user = get_user_model().objects.create_user(username="location_patient")
        self.patient_user.groups.add(Group.objects.get_or_create(name="Patient")[0])
        self.patient = Patient.objects.create(user=self.patient_user, reference="LOCATION-TEST", full_name="Fictional Patient", date_of_birth="2000-01-01", preferred_branch=self.main)
        self.client = APIClient()

    def test_configure_locations_preserves_existing_ids_names_and_patient_links(self):
        before = list(Branch.objects.values_list("pk", "name", "is_active"))
        for _ in range(2):
            call_command("configure_branch_locations", stdout=StringIO())
        self.assertEqual(before, list(Branch.objects.values_list("pk", "name", "is_active")))
        self.patient.refresh_from_db()
        self.assertEqual(self.patient.preferred_branch_id, self.main.pk)
        for branch in Branch.objects.filter(code__in=LOCATIONS):
            address, latitude, longitude, _ = LOCATIONS[branch.code]
            self.assertEqual((branch.address, branch.latitude, branch.longitude), (address, Decimal(latitude), Decimal(longitude)))

    def test_missing_branch_aborts_configuration(self):
        Branch.objects.get(code="Tastak-1").delete()
        with self.assertRaises(CommandError):
            call_command("configure_branch_locations", stdout=StringIO())
        self.main.refresh_from_db()
        self.assertEqual(self.main.address, "")

    def test_coordinate_validation_and_database_constraint(self):
        for data in ({"latitude": "91", "longitude": "76"}, {"latitude": "43", "longitude": "181"}, {"latitude": "NaN", "longitude": "76"}, {"latitude": "43"}, {"latitude": "43", "longitude": "76", "address": ""}):
            serializer = BranchSerializer(self.main, data={"address": "Fictional test address"} | data, partial=True)
            self.assertFalse(serializer.is_valid(), data)
            self.main.refresh_from_db()
        for data in ({"latitude": Decimal("91"), "longitude": Decimal("76")}, {"latitude": Decimal("43"), "longitude": None}):
            with self.assertRaises(IntegrityError), transaction.atomic():
                Branch.objects.filter(pk=self.main.pk).update(**data)

    def test_public_list_exposes_locations_and_only_admin_can_edit(self):
        call_command("configure_branch_locations", stdout=StringIO())
        response = self.client.get("/api/branches/")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(all(row["address"] and row["latitude"] and row["longitude"] for row in response.data))
        self.client.force_authenticate(self.patient_user)
        self.assertEqual(self.client.patch(f"/api/admin/branches/{self.main.pk}/", {"address": "Changed"}).status_code, 403)
        admin = get_user_model().objects.create_user(username="location_admin", is_superuser=True)
        self.client.force_authenticate(admin)
        self.assertEqual(self.client.patch(f"/api/admin/branches/{self.main.pk}/", {"address": "Updated test address"}).status_code, 200)

    def test_patient_can_change_only_own_preference_to_an_active_branch(self):
        self.client.force_authenticate(self.patient_user)
        selected = Branch.objects.get(code="Tastak-1")
        response = self.client.patch("/api/auth/patient/", {"preferred_branch": selected.pk}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.patient.refresh_from_db()
        self.assertEqual(self.patient.preferred_branch_id, selected.pk)
        self.assertEqual(self.client.get("/api/auth/me/").data["active_branch"]["id"], selected.pk)
        self.assertEqual(self.client.patch("/api/auth/patient/", {"user": 999, "allergy_notes": "tampered"}, format="json").status_code, 400)
        selected.is_active = False
        selected.save()
        self.assertEqual(self.client.patch("/api/auth/patient/", {"preferred_branch": selected.pk}, format="json").status_code, 400)
        self.assertEqual(self.client.patch("/api/auth/patient/", {"preferred_branch": None}, format="json").status_code, 200)
