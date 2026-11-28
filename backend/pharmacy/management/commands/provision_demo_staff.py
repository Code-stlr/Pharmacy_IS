"""Operator-only seed for the explicitly public, fictional staff accounts.

This writes the inspected managed Better Auth user/account schema as a one-time data
bootstrap, using Better Auth's installed password hasher. Never expose it as a web API.
It grants pharmacy roles only, not Neon Auth administration privileges.
"""
import json
from pathlib import Path
import shutil
import subprocess
from uuid import uuid4

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction
from pharmacy.branches import role
from pharmacy.models import Branch, NeonIdentity, UserBranch

DEMO_PASSWORD = "Demo-Pharmacy-2026!"
STAFF = [
    ("admin@toppharmacy.com", "Demo Admin", "Admin", None),
    ("aidaemp001_main@toppharmacy.com", "Aida", "Pharmacist", "MAIN"),
    ("timuremp002_main@toppharmacy.com", "Timur", "Pharmacist", "MAIN"),
    ("daniyaremp003_tolebi@toppharmacy.com", "Daniyar", "Pharmacist", "Tole-bi-1"),
    ("madinaemp004_tolebi@toppharmacy.com", "Madina", "Pharmacist", "Tole-bi-1"),
    ("armanemp005_tastak@toppharmacy.com", "Arman", "Pharmacist", "Tastak-1"),
    ("aliyaemp006_tastak@toppharmacy.com", "Aliya", "Pharmacist", "Tastak-1"),
    ("diasemp007_dostyq@toppharmacy.com", "Dias", "Pharmacist", "dostyq-1"),
    ("saraemp008_dostyq@toppharmacy.com", "Sara", "Pharmacist", "dostyq-1"),
]


def password_hashes(count):
    root = Path(__file__).resolve().parents[4]
    node = shutil.which("node")
    if not node:
        raise CommandError("Install Node and run npm ci in frontend before provisioning.")
    result = subprocess.run([node, str(root / "scripts/hash_neon_passwords.mjs")],
                            input=json.dumps({"password": DEMO_PASSWORD, "count": count}),
                            capture_output=True, text=True, timeout=60)
    if result.returncode:
        raise CommandError("Better Auth password hashing failed. Run npm ci in frontend and check the installed SDK.")
    hashes = json.loads(result.stdout)
    if len(hashes) != count or any(not isinstance(value, str) or not value for value in hashes):
        raise CommandError("Invalid Better Auth hash output.")
    return hashes


class Command(BaseCommand):
    help = "Provision the nine owner-approved public demo staff logins, preserving existing accounts and passwords."

    def add_arguments(self, parser):
        parser.add_argument("--shared-demo", action="store_true", help="Explicitly create accounts with the documented public demo password.")

    @transaction.atomic
    def handle(self, *args, **options):
        if not options["shared_demo"] or not settings.NEON_AUTH_URL:
            raise CommandError("This seed requires Neon Auth and explicit --shared-demo. Use fictional demo data only.")
        # Serialize operator runs; the same transaction includes both managed and pharmacy rows.
        with connection.cursor() as cursor:
            cursor.execute("SELECT pg_advisory_xact_lock(74201892)")
        codes = {entry[3] for entry in STAFF if entry[3]}
        branches = {branch.code: branch for branch in Branch.objects.select_for_update().filter(code__in=codes, is_active=True)}
        if set(branches) != codes:
            raise CommandError("All four configured branches must exist and be active. No changes made.")
        pending = []
        for email, name, assigned_role, branch_code in STAFF:
            with connection.cursor() as cursor:
                cursor.execute('SELECT id,"emailVerified" FROM neon_auth."user" WHERE lower(email)=lower(%s)', [email])
                managed = cursor.fetchone()
            local = get_user_model().objects.filter(username=email).first()
            if managed or local:
                mapping = NeonIdentity.objects.filter(subject=str(managed[0]), user=local).first() if managed and local else None
                if not mapping or not managed[1] or not local.is_active or role(local) != assigned_role:
                    raise CommandError(f"Existing identity conflict for {email}; refusing to claim or overwrite it.")
                with connection.cursor() as cursor:
                    cursor.execute('SELECT 1 FROM neon_auth.account WHERE "userId"=%s AND "providerId"=\'credential\' AND password IS NOT NULL', [managed[0]])
                    if not cursor.fetchone():
                        raise CommandError(f"Existing credential missing for {email}; refusing to overwrite it.")
                if branch_code and not UserBranch.objects.filter(user=local, branch=branches[branch_code]).exists():
                    raise CommandError(f"Existing branch assignment differs for {email}; refusing to overwrite it.")
                continue
            pending.append((email, name, assigned_role, branch_code))
        hashes = password_hashes(len(pending)) if pending else []
        for (email, name, assigned_role, branch_code), password_hash in zip(pending, hashes):
            subject = uuid4()
            with connection.cursor() as cursor:
                # Trusted provisioning of login IDs, not a claim that their domain has real mailboxes.
                cursor.execute('''INSERT INTO neon_auth."user" (id,name,email,"emailVerified",role)
                                  VALUES (%s,%s,%s,true,'user')''', [subject, name, email])
                cursor.execute('''INSERT INTO neon_auth.account (id,"accountId","providerId","userId",password,"updatedAt")
                                  VALUES (%s,%s,'credential',%s,%s,CURRENT_TIMESTAMP)''',
                               [uuid4(), str(subject), subject, password_hash])
            user = get_user_model().objects.create_user(username=email, email=email, first_name=name)
            user.groups.add(Group.objects.get_or_create(name=assigned_role)[0])
            NeonIdentity.objects.create(subject=str(subject), user=user)
            if branch_code:
                UserBranch.objects.create(user=user, branch=branches[branch_code])
        self.stdout.write(self.style.SUCCESS(f"Created {len(pending)} demo staff accounts; existing accounts and passwords unchanged."))
