from django.conf import settings
from django.db import migrations


def backfill_main_branch(apps, schema_editor):
    alias = schema_editor.connection.alias
    Branch = apps.get_model("pharmacy", "Branch")
    DrugBatch = apps.get_model("pharmacy", "DrugBatch")
    Patient = apps.get_model("pharmacy", "Patient")
    UserBranch = apps.get_model("pharmacy", "UserBranch")
    User = apps.get_model(settings.AUTH_USER_MODEL)

    main, _ = Branch.objects.using(alias).get_or_create(code="MAIN", defaults={"name": "Main Branch"})
    DrugBatch.objects.using(alias).filter(branch__isnull=True).update(branch=main)
    Patient.objects.using(alias).filter(preferred_branch__isnull=True).update(preferred_branch=main)
    pharmacists = User.objects.using(alias).filter(
        groups__name="Pharmacist", is_superuser=False, branch_assignment__isnull=True,
    ).exclude(groups__name="Admin")
    UserBranch.objects.using(alias).bulk_create([
        UserBranch(user_id=user_id, branch=main)
        for user_id in pharmacists.values_list("pk", flat=True)
    ])


class Migration(migrations.Migration):
    dependencies = [("pharmacy", "0003_branches")]

    operations = [migrations.RunPython(backfill_main_branch, migrations.RunPython.noop)]
