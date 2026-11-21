import os
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.contrib.auth.password_validation import validate_password
from django.core.management import BaseCommand, CommandError
from django.db import transaction
from pharmacy.models import MAIN_BRANCH_CODE, Branch, Patient, UserBranch


class Command(BaseCommand):
    help = "Create admin_demo, pharmacist_demo and patient_demo with DEMO_PASSWORD; never resets existing accounts."

    def add_arguments(self, parser):
        parser.add_argument(
            "--shared-demo", action="store_true",
            help="Use the public team demo password on a local fictional database.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        password = "Demo-Pharmacy-2026!" if options["shared_demo"] else os.environ.get("DEMO_PASSWORD", "")
        if not password:
            raise CommandError("Set DEMO_PASSWORD to a strong demo-only password.")
        validate_password(password)
        for username, role in [("admin_demo", "Admin"), ("pharmacist_demo", "Pharmacist"), ("patient_demo", "Patient")]:
            group, _ = Group.objects.get_or_create(name=role)
            user, created = get_user_model().objects.get_or_create(username=username)
            if created:
                user.set_password(password)
                user.save()
                user.groups.add(group)
                if role == "Pharmacist":
                    main, _ = Branch.objects.get_or_create(code=MAIN_BRANCH_CODE, defaults={"name": "Main Branch"})
                    UserBranch.objects.create(user=user, branch=main)
                if role == "Patient":
                    patient = Patient.objects.filter(reference="DEMO-P001", user__isnull=True).first()
                    if patient:
                        patient.user = user
                        patient.save(update_fields=["user"])
        self.stdout.write(self.style.SUCCESS("Demo accounts created where missing. Existing accounts unchanged."))
