from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction
from django.db.models.deletion import ProtectedError
from rest_framework import serializers, viewsets, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from .api import role, ResourceViewSet
from .models import Category, Supplier, Doctor, Medication, Patient
from .serializers import CategorySerializer, SupplierSerializer, DoctorSerializer, MedicationSerializer, PatientSerializer


class AdminOnly(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_active and role(request.user) == 'Admin'


class AdminUserSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(choices=['Admin', 'Pharmacist', 'Patient'])
    password = serializers.CharField(write_only=True, required=False, trim_whitespace=False, max_length=128)

    class Meta:
        model = get_user_model()
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'is_active', 'password']

    def to_representation(self, instance):
        result = {key: getattr(instance, key) for key in self.Meta.fields if key not in ['role', 'password']}
        result['role'] = role(instance)
        return result

    def validate(self, attrs):
        if not self.instance and not attrs.get('password'):
            raise ValidationError({'code': 'password_required'})
        if 'password' in attrs:
            candidate = self.instance or get_user_model()(username=attrs.get('username', ''))
            try:
                validate_password(attrs['password'], user=candidate)
            except DjangoValidationError:
                raise ValidationError({'code': 'weak_password'})
        return attrs

    def save_user(self, instance, validated_data):
        assigned_role = validated_data.pop('role', None)
        password = validated_data.pop('password', None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if password:
            instance.set_password(password)
        instance.save()
        if assigned_role:
            instance.groups.remove(*Group.objects.filter(name__in=['Admin', 'Pharmacist', 'Patient']))
            instance.groups.add(Group.objects.get_or_create(name=assigned_role)[0])
        return instance

    def create(self, validated_data):
        return self.save_user(get_user_model()(), validated_data)

    def update(self, instance, validated_data):
        return self.save_user(instance, validated_data)


class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = get_user_model().objects.all().order_by('username')
    serializer_class = AdminUserSerializer
    permission_classes = [AdminOnly]
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def perform_create(self, serializer):
        try:
            with transaction.atomic():
                serializer.save()
        except IntegrityError:
            raise ValidationError({'code': 'conflict'})

    def guard(self, target, changes=None, deleting=False):
        if target.is_superuser:
            raise ValidationError({'code': 'protected_account'})
        removing_access = deleting or changes.get('is_active') is False or changes.get('role', role(target)) != 'Admin'
        if target.pk == self.request.user.pk and removing_access:
            raise ValidationError({'code': 'self_protection'})
        if target.is_active and role(target) == 'Admin' and removing_access:
            admins = [u for u in get_user_model().objects.filter(is_active=True) if role(u) == 'Admin']
            if len(admins) <= 1:
                raise ValidationError({'code': 'last_admin'})

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        # Serialize account administration to prevent two admins removing each other's access concurrently.
        list(get_user_model().objects.select_for_update().order_by('pk'))
        request.user.refresh_from_db()
        self.check_permissions(request)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.guard(instance, serializer.validated_data)
        try:
            with transaction.atomic():
                serializer.save()
        except IntegrityError:
            raise ValidationError({'code': 'conflict'})
        return Response(serializer.data)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        list(get_user_model().objects.select_for_update().order_by('pk'))
        request.user.refresh_from_db()
        self.check_permissions(request)
        target = self.get_object()
        self.guard(target, {}, deleting=True)
        if Patient.objects.filter(user=target).exists():
            return Response({'code': 'protected_record'}, status=status.HTTP_409_CONFLICT)
        try:
            with transaction.atomic():
                target.delete()
        except (ProtectedError, IntegrityError):
            return Response({'code': 'protected_record'}, status=status.HTTP_409_CONFLICT)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminResourceViewSet(ResourceViewSet):
    permission_classes = [AdminOnly]
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        target = self.get_queryset().select_for_update().get(pk=self.get_object().pk)
        try:
            with transaction.atomic():
                target.delete()
        except (ProtectedError, IntegrityError):
            return Response({'code': 'protected_record'}, status=status.HTTP_409_CONFLICT)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminCategoryViewSet(AdminResourceViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    search_fields = ['name']


class AdminSupplierViewSet(AdminResourceViewSet):
    queryset = Supplier.objects.all().order_by('name')
    serializer_class = SupplierSerializer
    search_fields = ['name']


class AdminDoctorViewSet(AdminResourceViewSet):
    queryset = Doctor.objects.all().order_by('full_name')
    serializer_class = DoctorSerializer
    search_fields = ['full_name', 'license_number']


class AdminMedicationViewSet(AdminResourceViewSet):
    queryset = Medication.objects.all().order_by('name')
    serializer_class = MedicationSerializer
    search_fields = ['name', 'active_ingredient']


class AdminPatientViewSet(AdminResourceViewSet):
    queryset = Patient.objects.all().order_by('reference')
    serializer_class = PatientSerializer
    search_fields = ['reference', 'full_name']
