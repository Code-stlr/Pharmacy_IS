from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pharmacy', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Allergy',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=120, unique=True)),
                ('ingredient_keyword', models.CharField(blank=True, max_length=120)),
            ],
        ),
        migrations.AddField(
            model_name='patient',
            name='allergies',
            field=models.ManyToManyField(blank=True, related_name='patients', to='pharmacy.allergy'),
        ),
    ]
