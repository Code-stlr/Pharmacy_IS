from unittest.mock import patch
from django.db import OperationalError
from django.test import SimpleTestCase


class HealthTests(SimpleTestCase):
    def test_api_documentation_requires_login(self):
        self.assertEqual(self.client.get('/api/schema/').status_code, 403)
        self.assertEqual(self.client.get('/api/docs/').status_code, 403)

    @patch("config.urls.connection")
    def test_ready(self, connection):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})
        connection.cursor.return_value.__enter__.return_value.execute.assert_called_once_with("SELECT 1")

    @patch("config.urls.connection")
    def test_database_unavailable(self, connection):
        connection.cursor.side_effect = OperationalError("private database details")
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json(), {"status": "unavailable"})

