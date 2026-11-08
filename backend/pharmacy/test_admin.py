from io import StringIO
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient
from .models import Category, Medication, Patient


class AdminTests(TestCase):
    def setUp(self):
        call_command('seed_demo', stdout=StringIO())
        self.admin = get_user_model().objects.create_user(username='testadmin', password='Strong-admin-5831!')
        self.admin.groups.add(Group.objects.get_or_create(name='Admin')[0])
        self.pharmacist = get_user_model().objects.create_user(username='testpharmacist')
        self.pharmacist.groups.add(Group.objects.get_or_create(name='Pharmacist')[0])
        self.patient = get_user_model().objects.create_user(username='testpatient')
        self.patient.groups.add(Group.objects.get_or_create(name='Patient')[0])
        self.client = APIClient()

    def test_every_admin_endpoint_rejects_anonymous_pharmacists_and_patients(self):
        for user in [None, self.pharmacist, self.patient]:
            self.client.force_authenticate(user)
            for resource in ['users', 'patients', 'medications', 'categories', 'suppliers', 'doctors']:
                with self.subTest(user=user, resource=resource):
                    self.assertEqual(self.client.get(f'/api/admin/{resource}/').status_code, 403)
                    self.assertEqual(self.client.post(f'/api/admin/{resource}/', {}, format='json').status_code, 403)
                    self.assertEqual(self.client.patch(f'/api/admin/{resource}/1/', {}, format='json').status_code, 403)
                    self.assertEqual(self.client.delete(f'/api/admin/{resource}/1/').status_code, 403)

    def test_user_crud_and_hashed_passwords(self):
        self.client.force_authenticate(self.admin)
        payload = {'username':'created-user', 'role':'Pharmacist', 'password':'Distinct-admin-created-5931!', 'email':'demo@example.test'}
        response = self.client.post('/api/admin/users/', payload, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        user = get_user_model().objects.get(pk=response.data['id'])
        self.assertTrue(user.check_password(payload['password']))
        self.assertNotIn('password', response.data)
        self.assertNotIn('is_superuser', response.data)
        self.assertEqual(response.data['role'], 'Pharmacist')
        url = f'/api/admin/users/{user.pk}/'
        response = self.client.patch(url, {'role':'Patient','first_name':'Updated','is_superuser':True}, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['role'], 'Patient')
        user.refresh_from_db()
        self.assertFalse(user.is_superuser)
        self.assertEqual(self.client.delete(url).status_code, 204)
        self.assertFalse(get_user_model().objects.filter(pk=user.pk).exists())

    def test_password_is_required_and_validated(self):
        self.client.force_authenticate(self.admin)
        for password in [None, '123']:
            payload = {'username':'weak','role':'Admin'}
            if password is not None:
                payload['password'] = password
            self.assertEqual(self.client.post('/api/admin/users/', payload, format='json').status_code, 400)
        self.assertFalse(get_user_model().objects.filter(username='weak').exists())

    def test_admin_cannot_remove_own_access_even_with_string_false(self):
        self.client.force_authenticate(self.admin)
        url = f'/api/admin/users/{self.admin.pk}/'
        self.assertEqual(self.client.delete(url).status_code, 400)
        self.assertEqual(self.client.patch(url, {'is_active':'false'}, format='json').status_code, 400)
        self.assertEqual(self.client.patch(url, {'role':'Patient'}, format='json').status_code, 400)
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.is_active)

    def test_superuser_and_linked_patient_account_are_protected(self):
        self.client.force_authenticate(self.admin)
        superuser = get_user_model().objects.create_superuser(username='super', password='Strong-super-5931!')
        self.assertEqual(self.client.delete(f'/api/admin/users/{superuser.pk}/').status_code, 400)
        patient = Patient.objects.get()
        patient.user = self.patient
        patient.save()
        self.assertEqual(self.client.delete(f'/api/admin/users/{self.patient.pk}/').status_code, 409)
        self.assertEqual(self.client.patch(f'/api/admin/users/{self.patient.pk}/', {'is_active':False}, format='json').status_code, 200)

    def test_reference_record_crud_and_protected_deletion(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post('/api/admin/categories/', {'name':'Disposable demo category'}, format='json')
        self.assertEqual(response.status_code, 201)
        url = f"/api/admin/categories/{response.data['id']}/"
        self.assertEqual(self.client.patch(url, {'name':'Updated demo category'}, format='json').status_code, 200)
        self.assertEqual(self.client.delete(url).status_code, 204)
        protected_category = Category.objects.get(name='Demo medicines')
        self.assertEqual(self.client.delete(f'/api/admin/categories/{protected_category.pk}/').status_code, 409)
        self.assertTrue(Category.objects.filter(pk=protected_category.pk).exists())

    def test_unused_medication_can_be_deleted_but_stocked_medication_cannot(self):
        self.client.force_authenticate(self.admin)
        payload = {'name':'Disposable Demo','category':Category.objects.first().pk,'active_ingredient':'Fictional','strength':'1 mg','dosage_form':'tablet','unit':'tablet','requires_prescription':False,'is_active':True}
        response = self.client.post('/api/admin/medications/', payload, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(self.client.delete(f"/api/admin/medications/{response.data['id']}/").status_code, 204)
        existing = Medication.objects.first()
        self.assertEqual(self.client.delete(f'/api/admin/medications/{existing.pk}/').status_code, 409)
