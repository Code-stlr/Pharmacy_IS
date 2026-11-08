from datetime import timedelta
from io import StringIO
from concurrent.futures import ThreadPoolExecutor
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.cache import cache
from django.core.management import call_command
from django.db import close_old_connections
from django.test import TestCase, TransactionTestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework.exceptions import ValidationError
from .models import Patient, DrugBatch, PrescriptionLine, Prescription, DispensingTransaction
from .services import dispense


class WorkflowTests(TestCase):
    def setUp(self):
        cache.clear()
        call_command('seed_demo', stdout=StringIO())
        self.staff = get_user_model().objects.create_user(username='staff', password='Strong-test-5938!')
        self.staff.groups.add(Group.objects.get_or_create(name='Pharmacist')[0])
        self.user = get_user_model().objects.create_user(username='patient', password='Strong-test-5938!')
        self.user.groups.add(Group.objects.get_or_create(name='Patient')[0])
        self.patient = Patient.objects.get(reference='DEMO-P001')
        self.patient.user = self.user
        self.patient.save()
        self.batch = DrugBatch.objects.get(medication__requires_prescription=True)
        self.line = PrescriptionLine.objects.get()
        self.client = APIClient()

    def payload(self, **changes):
        values = {'patient': self.patient.pk, 'batch': self.batch.pk, 'prescription_line': self.line.pk, 'quantity': 5}
        return values | changes

    def test_login_requires_csrf_even_when_anonymous(self):
        client = APIClient(enforce_csrf_checks=True)
        self.assertEqual(client.post('/api/auth/login/', {'username':'staff','password':'Strong-test-5938!'}).status_code, 403)
        token = client.get('/api/auth/csrf/').json()['csrfToken']
        response = client.post('/api/auth/login/', {'username':'staff','password':'Strong-test-5938!'}, HTTP_X_CSRFTOKEN=token)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['role'], 'Pharmacist')
        self.assertEqual(client.post('/api/auth/logout/').status_code, 403)
        token = client.get('/api/auth/csrf/').json()['csrfToken']
        self.assertEqual(client.post('/api/auth/logout/', HTTP_X_CSRFTOKEN=token).status_code, 200)
        self.assertEqual(client.get('/api/auth/me/').status_code, 403)

    def test_registration_hashes_password_and_cannot_grant_admin(self):
        response = self.client.post('/api/auth/register/', {'username':'newpatient','password':'Another-strong-5829!','full_name':'Fictional New','date_of_birth':'2000-01-01','role':'Admin'}, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        user = get_user_model().objects.get(username='newpatient')
        self.assertTrue(user.check_password('Another-strong-5829!'))
        self.assertEqual(response.data['role'], 'Patient')
        self.assertTrue(Patient.objects.filter(user=user).exists())

    def test_weak_password_and_future_birth_date_rejected(self):
        response = self.client.post('/api/auth/register/', {'username':'bad','password':'123','full_name':'Demo','date_of_birth':'2099-01-01'}, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertFalse(get_user_model().objects.filter(username='bad').exists())

    def test_anonymous_and_unassigned_users_denied(self):
        self.assertEqual(self.client.get('/api/patients/').status_code, 403)
        nobody = get_user_model().objects.create_user(username='nobody')
        self.client.force_authenticate(nobody)
        self.assertEqual(self.client.get('/api/patients/').status_code, 403)

    def test_patient_cannot_read_others_or_write_clinical_records(self):
        other = Patient.objects.create(reference='OTHER', full_name='Other Fictional', date_of_birth='2000-01-01')
        self.client.force_authenticate(self.user)
        self.assertEqual(len(self.client.get('/api/patients/').data), 1)
        self.assertEqual(self.client.get(f'/api/patients/{other.pk}/').status_code, 404)
        self.assertEqual(self.client.post('/api/dispensings/', self.payload(), format='json').status_code, 403)
        self.assertEqual(self.client.patch('/api/auth/patient/', {'user': self.staff.pk}, format='json').status_code, 400)
        self.assertEqual(self.client.patch('/api/auth/patient/', {'phone': '+70000000000'}, format='json').status_code, 200)

    def test_profile_cannot_escalate_role(self):
        self.client.force_authenticate(self.user)
        response = self.client.patch('/api/auth/me/', {'first_name':'Updated','is_superuser':True,'role':'Admin'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_superuser)
        self.assertEqual(response.data['role'], 'Patient')

    def test_success_partial_completion_and_readonly_history(self):
        self.client.force_authenticate(self.staff)
        for amount in [5,15]:
            response = self.client.post('/api/dispensings/', self.payload(quantity=amount), format='json')
            self.assertEqual(response.status_code, 201, response.data)
        self.batch.refresh_from_db()
        self.assertEqual(self.batch.stock_quantity, 80)
        self.assertEqual(Prescription.objects.get().status, 'completed')
        self.assertEqual(DispensingTransaction.objects.count(), 2)
        self.assertEqual(self.client.delete('/api/dispensings/1/').status_code, 405)

    def test_failure_does_not_change_stock_or_history(self):
        self.client.force_authenticate(self.staff)
        for payload in [self.payload(quantity=21), self.payload(quantity=0), self.payload(prescription_line=None)]:
            self.assertEqual(self.client.post('/api/dispensings/', payload, format='json').status_code, 400)
        self.batch.refresh_from_db()
        self.assertEqual(self.batch.stock_quantity,100)
        self.assertEqual(DispensingTransaction.objects.count(),0)

    def test_expiry_and_patient_mismatch_rejected(self):
        self.client.force_authenticate(self.staff)
        other = Patient.objects.create(reference='OTHER', full_name='Other Fictional', date_of_birth='2000-01-01')
        self.assertEqual(self.client.post('/api/dispensings/', self.payload(patient=other.pk), format='json').status_code,400)
        self.batch.received_on=timezone.localdate()-timedelta(days=2)
        self.batch.expires_on=timezone.localdate()-timedelta(days=1)
        self.batch.save()
        self.assertEqual(self.client.post('/api/dispensings/', self.payload(), format='json').status_code,400)
        self.assertFalse(DispensingTransaction.objects.exists())

    def test_otc_dispensing_and_stock_limit(self):
        self.client.force_authenticate(self.staff)
        otc=DrugBatch.objects.get(medication__requires_prescription=False)
        self.assertEqual(self.client.post('/api/dispensings/',self.payload(batch=otc.pk,prescription_line=None,quantity=101),format='json').status_code,400)
        self.assertEqual(self.client.post('/api/dispensings/',self.payload(batch=otc.pk,prescription_line=None),format='json').status_code,201)

    def test_invalid_prescription_states_and_inactive_medication(self):
        self.client.force_authenticate(self.staff)
        rx = self.line.prescription
        today = timezone.localdate()
        for changes in [{'status':'cancelled'}, {'issued_on':today-timedelta(days=2),'valid_until':today-timedelta(days=1)}, {'issued_on':today+timedelta(days=1),'valid_until':today+timedelta(days=2)}]:
            with self.subTest(changes=changes):
                Prescription.objects.filter(pk=rx.pk).update(**changes)
                self.assertEqual(self.client.post('/api/dispensings/', self.payload(), format='json').status_code,400)
                Prescription.objects.filter(pk=rx.pk).update(status='active',issued_on=today,valid_until=today+timedelta(days=30))
        medication=self.batch.medication
        medication.is_active=False
        medication.save()
        self.assertEqual(self.client.post('/api/dispensings/', self.payload(), format='json').status_code,400)
        self.assertFalse(DispensingTransaction.objects.exists())

    def test_patient_history_and_prescriptions_are_scoped(self):
        self.client.force_authenticate(self.staff)
        self.client.post('/api/dispensings/', self.payload(), format='json')
        other=get_user_model().objects.create_user(username='otherpatient')
        other.groups.add(Group.objects.get_or_create(name='Patient')[0])
        self.client.force_authenticate(other)
        self.assertEqual(self.client.get('/api/dispensings/').data,[])
        self.assertEqual(self.client.get('/api/prescriptions/').data,[])
        self.client.force_authenticate(self.user)
        self.assertEqual(len(self.client.get('/api/dispensings/').data),1)
        self.assertEqual(len(self.client.get('/api/prescriptions/').data),1)

    def test_inventory_creation_validation_and_stock_is_not_editable(self):
        self.client.force_authenticate(self.staff)
        self.assertEqual(self.client.post('/api/categories/',{'name':'New demo category'},format='json').status_code,201)
        self.assertEqual(self.client.patch(f'/api/patients/{self.patient.pk}/',{'date_of_birth':'2099-01-01'},format='json').status_code,400)
        self.assertEqual(self.client.patch(f'/api/batches/{self.batch.pk}/',{'stock_quantity':999},format='json').status_code,405)

    def test_nested_prescription_creation_and_search(self):
        self.client.force_authenticate(self.staff)
        rx=Prescription.objects.get()
        payload={'reference':'SEARCH-RX','patient':self.patient.pk,'doctor':rx.doctor_id,'issued_on':str(rx.issued_on),'valid_until':str(rx.valid_until),'lines':[{'medication':self.batch.medication_id,'quantity_prescribed':10,'directions':'Demo only'}]}
        response=self.client.post('/api/prescriptions/',payload,format='json')
        self.assertEqual(response.status_code,201,response.data)
        for endpoint,search in [('prescriptions','SEARCH-RX'),('patients','Demo Patient'),('medications','Prescription Medicine')]:
            self.assertEqual(len(self.client.get(f'/api/{endpoint}/',{'search':search}).data),1)
        self.assertEqual(self.client.post('/api/prescriptions/',payload|{'reference':'EMPTY','lines':[]},format='json').status_code,400)
        self.assertFalse(Prescription.objects.filter(reference='EMPTY').exists())


class ConcurrentDispensingTests(TransactionTestCase):
    def test_simultaneous_otc_requests_cannot_oversell_stock(self):
        call_command('seed_demo',stdout=StringIO())
        user=get_user_model().objects.create_user(username='stockconcurrent')
        patient=Patient.objects.get()
        batch=DrugBatch.objects.get(medication__requires_prescription=False)
        def attempt(_):
            close_old_connections()
            try:
                dispense(patient=patient,batch=batch,prescription_line=None,quantity=75,pharmacist=user)
                return 'ok'
            except ValidationError:
                return 'rejected'
            finally:
                close_old_connections()
        with ThreadPoolExecutor(max_workers=2) as pool:
            results=list(pool.map(attempt,range(2)))
        self.assertCountEqual(results,['ok','rejected'])
        batch.refresh_from_db()
        self.assertEqual(batch.stock_quantity,25)

    def test_simultaneous_requests_cannot_exceed_prescribed_quantity(self):
        call_command('seed_demo',stdout=StringIO())
        user=get_user_model().objects.create_user(username='concurrent')
        patient=Patient.objects.get()
        batch=DrugBatch.objects.get(medication__requires_prescription=True)
        line=PrescriptionLine.objects.get()
        def attempt(_):
            close_old_connections()
            try:
                dispense(patient=patient,batch=batch,prescription_line=line,quantity=15,pharmacist=user)
                return 'ok'
            except ValidationError:
                return 'rejected'
            finally:
                close_old_connections()
        with ThreadPoolExecutor(max_workers=2) as pool:
            results=list(pool.map(attempt,range(2)))
        self.assertCountEqual(results,['ok','rejected'])
        batch.refresh_from_db()
        self.assertEqual(batch.stock_quantity,85)
        self.assertEqual(DispensingTransaction.objects.count(),1)
