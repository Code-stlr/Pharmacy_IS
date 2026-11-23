import time
from unittest import mock
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

PASSWORD = 'Strong-test-5938!'


@override_settings(LOGIN_MAX_ATTEMPTS=5, LOGIN_LOCK_SECONDS=300)
class LoginLockTests(TestCase):
    def setUp(self):
        cache.clear()
        get_user_model().objects.create_user(username='lock_user', password=PASSWORD)
        self.client = APIClient()

    def attempt(self, password, username='lock_user'):
        return self.client.post('/api/auth/login/', {'username': username, 'password': password}, format='json')

    def test_wrong_password_below_limit_is_plain_error(self):
        for _ in range(4):
            response = self.attempt('wrong-password')
            self.assertEqual(response.status_code, 400)
            self.assertEqual(response.json()['code'], 'invalid_credentials')

    def test_fifth_wrong_password_locks_login_for_five_minutes(self):
        for _ in range(4):
            self.attempt('wrong-password')
        response = self.attempt('wrong-password')
        self.assertEqual(response.status_code, 429)
        self.assertEqual(response.json()['code'], 'login_locked')
        self.assertEqual(response.json()['retry_after'], 300)

    def test_correct_password_is_rejected_while_locked(self):
        for _ in range(5):
            self.attempt('wrong-password')
        response = self.attempt(PASSWORD)
        self.assertEqual(response.status_code, 429)
        self.assertEqual(response.json()['code'], 'login_locked')

    def test_login_works_again_after_lock_expires(self):
        for _ in range(5):
            self.attempt('wrong-password')
        later = time.time() + 301
        with mock.patch('time.time', return_value=later):
            response = self.attempt(PASSWORD)
        self.assertEqual(response.status_code, 200)

    def test_successful_login_resets_the_counter(self):
        for _ in range(4):
            self.attempt('wrong-password')
        self.assertEqual(self.attempt(PASSWORD).status_code, 200)
        self.client.post('/api/auth/logout/')
        for _ in range(4):
            self.assertEqual(self.attempt('wrong-password').status_code, 400)

    def test_unknown_username_is_locked_the_same_way(self):
        for _ in range(4):
            self.assertEqual(self.attempt('x', username='no_such_user').status_code, 400)
        self.assertEqual(self.attempt('x', username='no_such_user').status_code, 429)

    def test_other_users_are_not_affected(self):
        get_user_model().objects.create_user(username='other_user', password=PASSWORD)
        for _ in range(5):
            self.attempt('wrong-password')
        self.assertEqual(self.attempt(PASSWORD, username='other_user').status_code, 200)
