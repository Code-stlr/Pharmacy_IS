from django.conf import settings
from drf_spectacular.extensions import OpenApiAuthenticationExtension


class NeonAuthScheme(OpenApiAuthenticationExtension):
    target_class = "pharmacy.neon_auth.NeonAuthentication"

    @property
    def name(self):
        return ["neonBearer", "neonSession"] if settings.NEON_AUTH_URL else "cookieAuth"

    def get_security_definition(self, auto_schema):
        if settings.NEON_AUTH_URL:
            return [
                {"type": "http", "scheme": "bearer", "bearerFormat": "JWT"},
                {"type": "apiKey", "in": "header", "name": "X-Neon-Session"},
            ]
        return {"type": "apiKey", "in": "cookie", "name": settings.SESSION_COOKIE_NAME}
