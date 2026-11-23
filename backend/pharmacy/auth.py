import time
from uuid import uuid4
from django.conf import settings
from django.core.cache import cache
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.contrib.auth.models import Group
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction, IntegrityError
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import AnonRateThrottle
from drf_spectacular.utils import extend_schema
from .branches import account_branch, default_branch, role
from .models import Branch, Patient
from .serializers import BranchSerializer, PatientSerializer


def identity(request, user):
    current_role = role(user)
    branch = account_branch(request, user, current_role)
    return {
        "id": user.pk, "username": user.username, "first_name": user.first_name, "last_name": user.last_name,
        "email": user.email, "role": current_role, "active_branch": BranchSerializer(branch).data if branch else None,
    }


def csrf(request):
    return JsonResponse({"csrfToken": get_token(request)})


class Credentials(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(max_length=128, trim_whitespace=False, write_only=True)


class Registration(Credentials):
    full_name = serializers.CharField(max_length=200)
    date_of_birth = serializers.DateField()
    preferred_branch = serializers.PrimaryKeyRelatedField(queryset=Branch.objects.filter(is_active=True), required=False, allow_null=True)


class IdentitySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    role = serializers.CharField(allow_null=True)
    active_branch = BranchSerializer(allow_null=True)


class ProfileSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)


class PhoneSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=32, allow_blank=True)


class BranchSelection(serializers.Serializer):
    branch = serializers.PrimaryKeyRelatedField(queryset=Branch.objects.filter(is_active=True))


def login_keys(username):
    name = username.strip().lower()
    return "login-fails:" + name, "login-lock:" + name


def locked_response(seconds):
    seconds = max(1, int(seconds))
    return Response({"code": "login_locked", "retry_after": seconds}, status=429, headers={"Retry-After": str(seconds)})


@method_decorator(csrf_protect, name="dispatch")
@extend_schema(request=Credentials, responses=IdentitySerializer)
class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]
    def post(self, request):
        data = Credentials(data=request.data)
        data.is_valid(raise_exception=True)
        fails_key, lock_key = login_keys(data.validated_data["username"])
        locked_until = cache.get(lock_key)
        if locked_until:
            # Blocked: do not even check the password, so the lock cannot be used to guess it.
            return locked_response(locked_until - time.time())
        user = authenticate(request, **data.validated_data)
        if not user:
            # Counted for unknown usernames too, so the response never reveals whether an account exists.
            cache.add(fails_key, 0, settings.LOGIN_LOCK_SECONDS)
            try:
                fails = cache.incr(fails_key)
            except ValueError:
                cache.set(fails_key, 1, settings.LOGIN_LOCK_SECONDS)
                fails = 1
            if fails >= settings.LOGIN_MAX_ATTEMPTS:
                cache.set(lock_key, time.time() + settings.LOGIN_LOCK_SECONDS, settings.LOGIN_LOCK_SECONDS)
                cache.delete(fails_key)
                return locked_response(settings.LOGIN_LOCK_SECONDS)
            return Response({"code": "invalid_credentials"}, status=400)
        cache.delete(fails_key)
        login(request, user)
        return Response(identity(request, user))


@method_decorator(csrf_protect, name="dispatch")
@extend_schema(request=Registration, responses={201: IdentitySerializer})
class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]
    def post(self, request):
        data = Registration(data=request.data)
        data.is_valid(raise_exception=True)
        values = data.validated_data
        user = get_user_model()(username=values["username"])
        try:
            validate_password(values["password"], user=user)
            branch = values["preferred_branch"] if "preferred_branch" in values else default_branch()
            patient = Patient(reference="P-" + uuid4().hex[:20], full_name=values["full_name"],
                              date_of_birth=values["date_of_birth"], preferred_branch=branch)
            patient.full_clean()
            with transaction.atomic():
                if branch is not None and not Branch.objects.select_for_update(no_key=True).filter(pk=branch.pk, is_active=True).first():
                    return Response({"code": "branch_unavailable"}, status=400)
                user.set_password(values["password"])
                user.save()
                group, _ = Group.objects.get_or_create(name="Patient")
                user.groups.add(group)
                patient.user = user
                patient.save()
        except (DjangoValidationError, IntegrityError):
            return Response({"code": "registration_failed"}, status=400)
        login(request, user)
        return Response(identity(request, user), status=201)


@extend_schema(request=BranchSelection, responses=IdentitySerializer)
class ActiveBranchView(APIView):
    def post(self, request):
        if not request.user.is_active or role(request.user) != "Admin":
            raise PermissionDenied()
        selection = BranchSelection(data=request.data)
        selection.is_valid(raise_exception=True)
        request.session["active_branch_id"] = selection.validated_data["branch"].pk
        return Response(identity(request, request.user))


@extend_schema(request=None, responses=dict)
class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({"status": "ok"})


@extend_schema(request=ProfileSerializer, responses=IdentitySerializer)
class MeView(APIView):
    def get(self, request):
        return Response(identity(request, request.user))
    def patch(self, request):
        data = ProfileSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        for key, value in data.validated_data.items():
            setattr(request.user, key, value)
        request.user.save(update_fields=list(data.validated_data) or ["first_name"])
        return Response(identity(request, request.user))


@extend_schema(request=PhoneSerializer, responses=PatientSerializer)
class MyPatientView(APIView):
    def get(self, request):
        patient = Patient.objects.filter(user=request.user).first()
        return Response(PatientSerializer(patient).data if patient else None)
    def patch(self, request):
        patient = Patient.objects.filter(user=request.user).first()
        if not patient:
            return Response({"code": "not_found"}, status=404)
        # Patient users cannot alter identity, ownership or clinician-entered allergy notes.
        if set(request.data) - {"phone"}:
            return Response({"code": "forbidden_fields"}, status=400)
        serializer = PatientSerializer(patient, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
