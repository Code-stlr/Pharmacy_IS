from io import StringIO
from unittest.mock import patch
from uuid import uuid4
from django.contrib.auth import get_user_model
from django.core.management import call_command, CommandError
from django.db import connection
from django.test import TestCase, override_settings
from .branches import role
from .management.commands.provision_demo_staff import STAFF
from .models import Branch, NeonIdentity, UserBranch


@override_settings(NEON_AUTH_URL="https://auth.example.test/neondb/auth")
class DemoStaffTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        with connection.cursor() as cursor:
            cursor.execute('CREATE SCHEMA neon_auth')
            cursor.execute('''CREATE TABLE neon_auth."user" (id uuid PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE,
                              "emailVerified" boolean NOT NULL, role text)''')
            cursor.execute('''CREATE TABLE neon_auth.account (id uuid PRIMARY KEY, "accountId" text NOT NULL,
                              "providerId" text NOT NULL, "userId" uuid REFERENCES neon_auth."user"(id),
                              password text, "updatedAt" timestamptz NOT NULL)''')
        for code in {entry[3] for entry in STAFF if entry[3]}:
            Branch.objects.get_or_create(code=code, defaults={"name": code})

    def run_seed(self):
        with patch("pharmacy.management.commands.provision_demo_staff.password_hashes", side_effect=lambda count: ["verified-test-hash-" + str(i) for i in range(count)]) as hasher:
            call_command("provision_demo_staff", shared_demo=True, stdout=StringIO())
            return hasher.call_count

    def test_creates_direct_login_identities_roles_and_two_pharmacists_per_branch(self):
        self.assertEqual(self.run_seed(), 1)
        self.assertEqual(NeonIdentity.objects.count(), 9)
        for email, name, assigned_role, branch_code in STAFF:
            user = get_user_model().objects.get(username=email)
            self.assertEqual(user.email, email)
            self.assertEqual(role(user), assigned_role)
            self.assertFalse(user.has_usable_password())
            self.assertFalse(user.is_superuser)
            if branch_code:
                self.assertEqual(user.branch_assignment.branch.code, branch_code)
        for branch in Branch.objects.all():
            self.assertEqual(UserBranch.objects.filter(branch=branch).count(), 2)

    def test_rerun_preserves_ids_and_changed_passwords(self):
        self.run_seed()
        ids = list(NeonIdentity.objects.values_list("subject", "user_id"))
        with connection.cursor() as cursor:
            cursor.execute("UPDATE neon_auth.account SET password='changed-by-user'")
        self.assertEqual(self.run_seed(), 0)
        self.assertEqual(ids, list(NeonIdentity.objects.values_list("subject", "user_id")))
        with connection.cursor() as cursor:
            cursor.execute('SELECT DISTINCT password FROM neon_auth.account')
            self.assertEqual(cursor.fetchall(), [("changed-by-user",)])

    def test_does_not_claim_an_existing_unlinked_managed_identity(self):
        with connection.cursor() as cursor:
            cursor.execute('INSERT INTO neon_auth."user" VALUES (%s,%s,%s,true,\'user\')', [uuid4(), "Pre-existing", STAFF[0][0]])
        with self.assertRaises(CommandError):
            self.run_seed()
        self.assertEqual(NeonIdentity.objects.count(), 0)
        self.assertEqual(get_user_model().objects.count(), 0)

    def test_requires_explicit_demo_flag_and_all_active_branches(self):
        with self.assertRaises(CommandError):
            call_command("provision_demo_staff", stdout=StringIO())
        Branch.objects.filter(code="Tastak-1").update(is_active=False)
        with self.assertRaises(CommandError):
            self.run_seed()
        self.assertEqual(NeonIdentity.objects.count(), 0)
