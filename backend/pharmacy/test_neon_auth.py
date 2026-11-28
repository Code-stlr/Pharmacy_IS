import time
from datetime import date
from types import SimpleNamespace
from unittest.mock import patch
from uuid import uuid4

import jwt
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.db import connection
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import Branch, NeonIdentity, Patient


@override_settings(NEON_AUTH_URL="https://auth.example.test/neondb/auth", NEON_AUTH_ISSUER="", NEON_AUTH_AUDIENCE="")
class NeonAuthTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Only the disposable test database gets these managed-schema fixtures.
        with connection.cursor() as cursor:
            cursor.execute('CREATE SCHEMA neon_auth')
            cursor.execute('''CREATE TABLE neon_auth."user" (
                id uuid PRIMARY KEY, email text, name text, "emailVerified" boolean,
                banned boolean DEFAULT false, "banExpires" timestamptz)''')
            cursor.execute('''CREATE TABLE neon_auth.session (
                id uuid PRIMARY KEY, "userId" uuid, "expiresAt" timestamptz)''')
        cls.branch = Branch.objects.get_or_create(code="MAIN", defaults={"name": "Main"})[0]
        cls.legacy = get_user_model().objects.create_user(username="old_staff", password="Legacy-strong-5938!")
        cls.legacy.groups.add(Group.objects.get_or_create(name="Admin")[0])

    def setUp(self):
        self.key = Ed25519PrivateKey.generate()
        self.subject, self.session_id = str(uuid4()), str(uuid4())
        with connection.cursor() as cursor:
            cursor.execute('INSERT INTO neon_auth."user" (id,email,name,"emailVerified") VALUES (%s,%s,%s,true)',
                           [self.subject, "verified@example.test", "Verified Test"])
            cursor.execute('INSERT INTO neon_auth.session VALUES (%s,%s,CURRENT_TIMESTAMP + INTERVAL \'1 day\')',
                           [self.session_id, self.subject])
        self.jwks = patch("pharmacy.neon_auth.jwks_client", return_value=SimpleNamespace(
            get_signing_key_from_jwt=lambda _: SimpleNamespace(key=self.key.public_key())))
        self.jwks.start()
        self.addCleanup(self.jwks.stop)
        self.client = APIClient()
        self.authorize()

    def authorize(self, **changes):
        now = int(time.time())
        claims = dict(sub=self.subject, iat=now, exp=now + 900, iss="https://auth.example.test", aud="https://auth.example.test") | changes
        self.token = jwt.encode(claims, self.key, algorithm="EdDSA", headers={"kid": "test"})
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + self.token, HTTP_X_NEON_SESSION=self.session_id)

    def complete(self, **changes):
        return self.client.post("/api/auth/complete/", dict(full_name="Test Patient", date_of_birth="2000-01-01", preferred_branch=self.branch.pk) | changes, format="json")

    def test_new_verified_user_gets_only_patient_role_and_scoped_profile(self):
        self.authorize(role="Admin", email="spoofed@example.test")
        result = self.complete(role="Admin")
        self.assertEqual(result.status_code, 201, result.data)
        self.assertEqual(result.data["role"], "Patient")
        self.assertEqual(result.data["email"], "verified@example.test")
        user = NeonIdentity.objects.get(subject=self.subject).user
        self.assertFalse(user.has_usable_password())
        self.assertEqual(Patient.objects.get(user=user).date_of_birth, date(2000, 1, 1))
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 200)
        self.assertEqual(self.client.get("/api/admin/users/").status_code, 403)
        self.assertEqual(self.complete().data["id"], user.pk)
        self.assertEqual(Patient.objects.filter(user=user).count(), 1)

    def test_signature_issuer_audience_expiry_and_missing_claims_rejected(self):
        for changes in ({"iss": "https://evil.test"}, {"aud": "wrong"}, {"exp": int(time.time()) - 1}, {"sub": "malformed"}):
            self.authorize(**changes)
            self.assertEqual(self.complete().status_code, 403)
        self.authorize()
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + self.token[:-8] + "tampered", HTTP_X_NEON_SESSION=self.session_id)
        self.assertEqual(self.complete().status_code, 403)
        self.assertEqual(NeonIdentity.objects.count(), 0)

    def test_unverified_banned_or_revoked_session_cannot_complete_or_access(self):
        self.complete()
        with connection.cursor() as cursor:
            cursor.execute('UPDATE neon_auth."user" SET "emailVerified"=false')
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 401)
        with connection.cursor() as cursor:
            cursor.execute('UPDATE neon_auth."user" SET "emailVerified"=true,banned=true')
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 401)
        with connection.cursor() as cursor:
            cursor.execute('UPDATE neon_auth."user" SET banned=false')
            cursor.execute('DELETE FROM neon_auth.session')
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 401)
        self.assertEqual(self.complete().status_code, 403)

    def test_unmapped_session_requires_setup_and_legacy_cookie_is_not_accepted(self):
        result = self.client.get("/api/auth/me/")
        self.assertEqual(result.status_code, 401)
        self.assertEqual(result.data["code"], "account_setup_required")
        self.assertEqual(self.client.get("/api/branches/").status_code, 200)
        self.client.credentials()
        self.client.force_login(self.legacy)
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 401)
        for endpoint in ("login", "register"):
            self.assertEqual(self.client.post(f"/api/auth/{endpoint}/", {}).status_code, 410)

    def test_legacy_link_preserves_id_role_and_records_and_disables_old_password(self):
        patient = Patient.objects.create(reference="LEGACY", full_name="Legacy", date_of_birth="2000-01-01", user=self.legacy)
        response = self.client.post("/api/auth/link-legacy/", {"username": "old_staff", "password": "Legacy-strong-5938!"})
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["id"], self.legacy.pk)
        self.assertEqual(response.data["role"], "Admin")
        patient.refresh_from_db()
        self.assertEqual(patient.user_id, self.legacy.pk)
        self.legacy.refresh_from_db()
        self.assertFalse(self.legacy.has_usable_password())
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 200)

    def test_wrong_legacy_password_rate_limit_is_shared_and_never_links(self):
        for _ in range(5):
            result = self.client.post("/api/auth/link-legacy/", {"username": "old_staff", "password": "wrong"})
            self.assertEqual(result.status_code, 400)
        result = self.client.post("/api/auth/link-legacy/", {"username": "old_staff", "password": "Legacy-strong-5938!"})
        self.assertEqual(result.status_code, 429)
        self.assertIn("Retry-After", result)
        self.assertFalse(NeonIdentity.objects.exists())

    def test_date_validation_inactive_user_and_csrf(self):
        self.assertEqual(self.complete(date_of_birth="2999-01-01").status_code, 400)
        self.assertFalse(NeonIdentity.objects.exists())
        client = APIClient(enforce_csrf_checks=True)
        client.credentials(HTTP_AUTHORIZATION="Bearer " + self.token, HTTP_X_NEON_SESSION=self.session_id)
        self.assertEqual(client.post("/api/auth/complete/", {}).status_code, 403)
        self.complete()
        user = NeonIdentity.objects.get().user
        user.is_active = False
        user.save()
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 401)

    def test_managed_email_and_password_are_not_changed_by_local_profile_or_admin(self):
        self.client.post("/api/auth/link-legacy/", {"username": "old_staff", "password": "Legacy-strong-5938!"})
        self.assertEqual(self.client.patch("/api/auth/me/", {"email": "other@example.test"}).status_code, 400)
        response = self.client.patch(f"/api/admin/users/{self.legacy.pk}/", {"password": "New-strong-5938!"})
        self.assertEqual(response.status_code, 400)
