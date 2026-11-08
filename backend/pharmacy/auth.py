from uuid import uuid4
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
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import AnonRateThrottle
from drf_spectacular.utils import extend_schema
from .api import role
from .models import Patient
from .serializers import PatientSerializer


def identity(user):
    return {"id": user.pk, "username": user.username, "first_name": user.first_name, "last_name": user.last_name, "email": user.email, "role": role(user)}


def csrf(request):
    return JsonResponse({"csrfToken": get_token(request)})


class Credentials(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(max_length=128, trim_whitespace=False, write_only=True)


class Registration(Credentials):
    full_name = serializers.CharField(max_length=200)
    date_of_birth = serializers.DateField()


class IdentitySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    role = serializers.CharField(allow_null=True)


class ProfileSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)


class PhoneSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=32, allow_blank=True)


@method_decorator(csrf_protect, name="dispatch")
@extend_schema(request=Credentials, responses=IdentitySerializer)
class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]
    def post(self, request):
        data = Credentials(data=request.data)
        data.is_valid(raise_exception=True)
        user = authenticate(request, **data.validated_data)
        if not user:
            return Response({"code": "invalid_credentials"}, status=400)
        login(request, user)
        return Response(identity(user))


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
            patient = Patient(reference="P-" + uuid4().hex[:20], full_name=values["full_name"], date_of_birth=values["date_of_birth"])
            patient.full_clean()
            with transaction.atomic():
                user.set_password(values["password"])
                user.save()
                group, _ = Group.objects.get_or_create(name="Patient")
                user.groups.add(group)
                patient.user = user
                patient.save()
        except (DjangoValidationError, IntegrityError):
            return Response({"code": "registration_failed"}, status=400)
        login(request, user)
        return Response(identity(user), status=201)


@extend_schema(request=None, responses=dict)
class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({"status": "ok"})


@extend_schema(request=ProfileSerializer, responses=IdentitySerializer)
class MeView(APIView):
    def get(self, request):
        return Response(identity(request.user))
    def patch(self, request):
        data = ProfileSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        for key, value in data.validated_data.items():
            setattr(request.user, key, value)
        request.user.save(update_fields=list(data.validated_data) or ["first_name"])
        return Response(identity(request.user))


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
