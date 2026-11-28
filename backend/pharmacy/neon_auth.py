"""Verify managed Neon identities while keeping pharmacy roles and ownership local."""
from functools import lru_cache
from urllib.parse import urlsplit
from uuid import UUID

import jwt
from django.conf import settings
from django.db import connection
from rest_framework.authentication import SessionAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed, APIException

from .models import NeonIdentity


class AuthUnavailable(APIException):
    status_code = 503
    default_detail = "Authentication service unavailable. Try again shortly."


@lru_cache(maxsize=4)
def jwks_client(url):
    return jwt.PyJWKClient(url, timeout=10, cache_jwk_set=True, lifespan=300)


def verified_identity(request):
    if not settings.NEON_AUTH_URL:
        raise AuthUnavailable()
    header = get_authorization_header(request).split()
    if len(header) != 2 or header[0].lower() != b"bearer":
        raise AuthenticationFailed("Sign in with Neon.")
    token = header[1]
    origin = urlsplit(settings.NEON_AUTH_URL)
    issuer = settings.NEON_AUTH_ISSUER or f"{origin.scheme}://{origin.netloc}"
    try:
        key = jwks_client(settings.NEON_AUTH_JWKS_URL).get_signing_key_from_jwt(token)
        claims = jwt.decode(token, key.key, algorithms=["EdDSA", "ES256", "RS256"],
                            issuer=issuer, audience=settings.NEON_AUTH_AUDIENCE or issuer,
                            options={"require": ["exp", "iat", "sub", "iss", "aud"]})
    except jwt.PyJWKClientConnectionError as exc:
        raise AuthUnavailable() from exc
    except (jwt.PyJWTError, ValueError) as exc:
        raise AuthenticationFailed("Invalid or expired session.") from exc
    session_id = request.headers.get("X-Neon-Session", "")
    try:
        UUID(session_id)
        UUID(claims["sub"])
    except (ValueError, TypeError, AttributeError) as exc:
        raise AuthenticationFailed("Invalid session.") from exc
    # Check the managed session as well as its JWT: logout and password reset revoke access immediately.
    with connection.cursor() as cursor:
        cursor.execute('''SELECT u.email, u.name, u."emailVerified"
                          FROM neon_auth."user" u JOIN neon_auth.session s ON s."userId" = u.id
                          WHERE u.id = %s AND s.id = %s AND s."expiresAt" > CURRENT_TIMESTAMP
                          AND (u.banned IS NOT TRUE OR u."banExpires" < CURRENT_TIMESTAMP)''',
                       [claims["sub"], session_id])
        row = cursor.fetchone()
    if not row:
        raise AuthenticationFailed("Session revoked or expired.")
    if row[2] is not True:
        raise AuthenticationFailed("Verify your email before signing in.")
    return {"subject": claims["sub"], "email": row[0], "name": row[1]}


class NeonAuthentication(SessionAuthentication):
    def authenticate(self, request):
        if not settings.NEON_AUTH_URL:
            return super().authenticate(request)
        if not get_authorization_header(request):
            return None
        principal = verified_identity(request)
        mapping = NeonIdentity.objects.select_related("user").filter(subject=principal["subject"]).first()
        if not mapping:
            raise AuthenticationFailed({"code": "account_setup_required"})
        if not mapping.user.is_active:
            raise AuthenticationFailed("Account disabled.")
        self.enforce_csrf(request)
        # Branch selection is a Django session value, scoped to the current external identity.
        if request.session.get("neon_subject") != principal["subject"]:
            request.session.flush()
            request.session["neon_subject"] = principal["subject"]
        return mapping.user, principal

    def authenticate_header(self, request):
        return "Bearer" if settings.NEON_AUTH_URL else None
