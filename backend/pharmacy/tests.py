from datetime import timedelta
from decimal import Decimal
from io import StringIO

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.db import IntegrityError, transaction
from django.db.models.deletion import ProtectedError
from django.test import TestCase
from django.utils import timezone

from .models import Category, Doctor, DrugBatch, DispensingTransaction, Medication, Patient, Prescription, PrescriptionLine, Supplier


class DomainTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command('seed_demo', stdout=StringIO())
        cls.patient = Patient.objects.get(reference='DEMO-P001')
        cls.batch = DrugBatch.objects.get(medication__requires_prescription=True)
        cls.line = PrescriptionLine.objects.get()
        cls.user = get_user_model().objects.create_user(username='test-pharmacist')

    def dispensing(self, **changes):
        values = dict(reference='TEST-TX', patient=self.patient, pharmacist=self.user,
                      batch=self.batch, prescription_line=self.line, quantity=2, unit_price=Decimal('25.00'))
        values.update(changes)
        return DispensingTransaction(**values)

    def test_seed_is_idempotent_and_preserves_stock(self):
        self.batch.stock_quantity = 75
        self.batch.save()
        call_command('seed_demo', stdout=StringIO())
        self.batch.refresh_from_db()
        self.assertEqual(self.batch.stock_quantity, 75)
        self.assertEqual([Category.objects.count(), Patient.objects.count(), Doctor.objects.count(), Supplier.objects.count(), Medication.objects.count(), DrugBatch.objects.count(), Prescription.objects.count(), PrescriptionLine.objects.count()], [1, 1, 1, 1, 2, 2, 1, 1])

    def test_negative_stock_is_rejected_by_database(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            DrugBatch.objects.filter(pk=self.batch.pk).update(stock_quantity=-1)

    def test_zero_price_is_rejected_by_database(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            DrugBatch.objects.filter(pk=self.batch.pk).update(unit_price=0)

    def test_invalid_batch_dates_are_rejected(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            DrugBatch.objects.filter(pk=self.batch.pk).update(expires_on=self.batch.received_on)

    def test_invalid_prescription_status_is_rejected(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            Prescription.objects.update(status='anything')

    def test_zero_prescription_quantity_is_rejected(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            PrescriptionLine.objects.filter(pk=self.line.pk).update(quantity_prescribed=0)

    def test_future_birth_date_is_rejected(self):
        self.patient.date_of_birth = timezone.localdate() + timedelta(days=1)
        with self.assertRaises(ValidationError):
            self.patient.full_clean()

    def test_matching_dispensing_validates(self):
        self.dispensing().full_clean()

    def test_otc_dispensing_does_not_require_prescription(self):
        self.dispensing(batch=DrugBatch.objects.get(medication__requires_prescription=False), prescription_line=None).full_clean()

    def test_prescription_required_for_rx_medication(self):
        with self.assertRaises(ValidationError):
            self.dispensing(prescription_line=None).full_clean()

    def test_wrong_medication_is_rejected(self):
        with self.assertRaises(ValidationError):
            self.dispensing(batch=DrugBatch.objects.get(medication__requires_prescription=False)).full_clean()

    def test_wrong_patient_is_rejected(self):
        other = Patient.objects.create(reference='OTHER', full_name='Other Demo', date_of_birth='2001-01-01')
        with self.assertRaises(ValidationError):
            self.dispensing(patient=other).full_clean()

    def test_history_prevents_deletion(self):
        self.dispensing().save()
        with self.assertRaises(ProtectedError):
            self.batch.delete()
        with self.assertRaises(ProtectedError):
            self.patient.delete()

    def test_duplicate_lot_is_rejected(self):
        self.batch.pk = None
        with self.assertRaises(IntegrityError), transaction.atomic():
            self.batch.save()
