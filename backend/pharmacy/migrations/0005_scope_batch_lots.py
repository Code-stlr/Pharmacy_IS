import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("pharmacy", "0004_backfill_main_branch")]

    operations = [
        migrations.AlterField(
            model_name="drugbatch",
            name="branch",
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="batches", to="pharmacy.branch"),
        ),
        migrations.AddConstraint(
            model_name="drugbatch",
            constraint=models.UniqueConstraint(fields=("branch", "medication", "lot_number"), name="unique_branch_medication_lot"),
        ),
        migrations.RemoveConstraint(model_name="drugbatch", name="unique_medication_lot"),
    ]
