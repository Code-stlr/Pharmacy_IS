"""Verify managed Neon identities while keeping pharmacy roles and ownership local."""
from hashlib import sha256
import time
from uuid import uuid4

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction, IntegrityError
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed, Throttled
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from .models import AuthRateLimit, Branch, NeonIdentity, Patient
from .neon_auth import verified_identity


def consume_rate(key, maximum, seconds):
    """A shared, atomic counter across Gunicorn workers; keys contain no raw personal data."""
    key = sha256(key.encode()).hexdigest()
    with transaction.atomic():
        counter, _ = AuthRateLimit.objects.get_or_create(key=key)
        counter = AuthRateLimit.objects.select_for_update().get(pk=counter.pk)
        now = time.time()
        if counter.expires_at <= now:
            counter.attempts, counter.expires_at = 0, now + seconds
        if counter.attempts >= maximum:
            raise Throttled(wait=max(1, int(counter.expires_at - now)))
        counter.attempts += 1
        counter.save(update_fields=["attempts", "expires_at"])


class CompleteAccount(serializers.Serializer):
    full_name = serializers.CharField(max_length=200)
    date_of_birth = serializers.DateField()
    preferred_branch = serializers.PrimaryKeyRelatedField(queryset=Branch.objects.filter(is_active=True), allow_null=True, required=False)


class LinkAccount(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(max_length=128, trim_whitespace=False, write_only=True)


@method_decorator(csrf_protect, name="dispatch")
class CompleteAccountView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(request=CompleteAccount, responses=dict, description="Requires a verified Neon JWT (Authorization: Bearer), X-Neon-Session and a CSRF token.")
    def post(self, request):
        principal = verified_identity(request)
        data = CompleteAccount(data=request.data)
        data.is_valid(raise_exception=True)
        try:
            with transaction.atomic():
                mapping = NeonIdentity.objects.select_related("user").filter(subject=principal["subject"]).first()
                if mapping:
                    user = mapping.user
                    if not user.is_active:
                        raise AuthenticationFailed("Account disabled.")
                else:
                    values = data.validated_data
                    branch = values.get("preferred_branch")
                    if branch and not Branch.objects.select_for_update(no_key=True).filter(pk=branch.pk, is_active=True).exists():
                        return Response({"code": "branch_unavailable"}, status=400)
                    patient = Patient(reference="P-" + uuid4().hex[:20], **values)
                    patient.full_clean()
                    user = get_user_model().objects.create_user(username="neon_" + uuid4().hex, email=principal["email"], first_name=values["full_name"][:150])
                    user.groups.add(Group.objects.get_or_create(name="Patient")[0])
                    NeonIdentity.objects.create(subject=principal["subject"], user=user)
                    patient.user = user
                    patient.save()
        except (DjangoValidationError, IntegrityError):
            return Response({"code": "registration_failed"}, status=400)
        from .auth import identity
        return Response(identity(request, user), status=201)


@method_decorator(csrf_protect, name="dispatch")
class LinkAccountView(APIView):
    """One-time proof of legacy ownership, never an email-based privilege transfer."""
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(request=LinkAccount, responses=dict, description="Requires a verified Neon JWT (Authorization: Bearer), X-Neon-Session and a CSRF token. Proves ownership with the legacy password.")
    def post(self, request):
        principal = verified_identity(request)
        data = LinkAccount(data=request.data)
        data.is_valid(raise_exception=True)
        username = data.validated_data["username"]
        consume_rate("link-ip:" + request.META.get("REMOTE_ADDR", ""), 20, 300)
        consume_rate("link-user:" + username.lower(), 5, 300)
        try:
            with transaction.atomic():
                user = get_user_model().objects.select_for_update().filter(username=username, is_active=True).first()
                valid = user.check_password(data.validated_data["password"]) if user else get_user_model()().check_password(data.validated_data["password"])
                if not user or not valid or NeonIdentity.objects.filter(user=user).exists():
                    return Response({"code": "invalid_credentials"}, status=400)
                NeonIdentity.objects.create(subject=principal["subject"], user=user)
                user.email = principal["email"]
                user.set_unusable_password()
                user.save(update_fields=["email", "password"])
        except IntegrityError:
            return Response({"code": "invalid_credentials"}, status=400)
        from .auth import identity
        return Response(identity(request, user))
