from django.contrib.auth import get_user_model
from django.conf import settings
from django.contrib.auth.models import Group
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction
from django.db.models.deletion import ProtectedError
from rest_framework import serializers, viewsets, status
from rest_framework.exceptions import ValidationError
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from .api import PatientViewSet, ResourceViewSet
from .branches import audit_patient, operating_branch, role
from .models import Branch, Category, Supplier, Doctor, Medication, Patient, UserBranch
from .serializers import BranchSerializer, CategorySerializer, SupplierSerializer, DoctorSerializer, MedicationSerializer


class AdminOnly(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_active and role(request.user) == 'Admin'


class AdminInBranch(AdminOnly):
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        request.operating_branch = operating_branch(request, 'Admin')
        return True


class AdminUserSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(choices=['Admin', 'Pharmacist', 'Patient'])
    password = serializers.CharField(write_only=True, required=False, trim_whitespace=False, max_length=128)
    branch = serializers.PrimaryKeyRelatedField(queryset=Branch.objects.filter(is_active=True), required=False, allow_null=True)
    patient = serializers.PrimaryKeyRelatedField(queryset=Patient.objects.all(), required=False)

    class Meta:
        model = get_user_model()
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'is_active', 'password', 'branch', 'patient']

    def to_representation(self, instance):
        result = {key: getattr(instance, key) for key in self.Meta.fields if key not in ['role', 'password', 'branch', 'patient']}
        current_role = role(instance)
        result.update(role=current_role, branch=None, patient=None)
        if current_role == 'Pharmacist':
            result['branch'] = UserBranch.objects.filter(user=instance).values_list('branch_id', flat=True).first()
        if current_role == 'Patient':
            patient = Patient.objects.filter(user=instance).first()
            if patient is not None:
                result.update(branch=patient.preferred_branch_id, patient=patient.pk)
        return result

    def validate(self, attrs):
        if settings.NEON_AUTH_URL and self.instance and hasattr(self.instance, "neon_identity"):
            if 'password' in attrs:
                raise ValidationError({'code': 'password_managed_by_neon'})
            if 'email' in attrs and attrs['email'] != self.instance.email:
                raise ValidationError({'code': 'email_managed_by_neon'})
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
        current_role = assigned_role or role(instance)
        password = validated_data.pop('password', None)
        request = self.context['request']
        specified_branch = 'branch' in validated_data
        branch = validated_data.pop('branch', None)
        requested_patient = validated_data.pop('patient', None)
        linked_patient = Patient.objects.filter(user=instance).first() if instance.pk else None

        if current_role != 'Patient' and (requested_patient or linked_patient):
            raise ValidationError({'code': 'protected_patient_account'})
        if current_role == 'Admin' and specified_branch and branch is not None:
            raise ValidationError({'code': 'invalid_branch_assignment'})
        if current_role == 'Pharmacist':
            if not specified_branch:
                previous = UserBranch.objects.select_related('branch').filter(user=instance).first() if instance.pk else None
                branch = previous.branch if previous else request.operating_branch
            if branch is None:
                raise ValidationError({'code': 'branch_required'})
            branch = Branch.objects.select_for_update(no_key=True).get(pk=branch.pk)
            if not branch.is_active and (specified_branch or validated_data.get('is_active', instance.is_active)):
                raise ValidationError({'code': 'branch_unavailable'})
        if current_role == 'Patient':
            if requested_patient is not None and linked_patient is not None and requested_patient.pk != linked_patient.pk:
                raise ValidationError({'code': 'protected_patient_account'})
            if specified_branch and requested_patient is None and linked_patient is None:
                raise ValidationError({'code': 'patient_record_required'})
            if branch is not None and not Branch.objects.select_for_update(no_key=True).filter(pk=branch.pk, is_active=True).first():
                raise ValidationError({'code': 'branch_unavailable'})

        for key, value in validated_data.items():
            setattr(instance, key, value)
        if password:
            instance.set_password(password)
        instance.save()
        if assigned_role:
            instance.groups.remove(*Group.objects.filter(name__in=['Admin', 'Pharmacist', 'Patient']))
            instance.groups.add(Group.objects.get_or_create(name=assigned_role)[0])
        if current_role == 'Pharmacist':
            UserBranch.objects.update_or_create(user=instance, defaults={'branch': branch})
        else:
            UserBranch.objects.filter(user=instance).delete()

        if requested_patient is not None or (linked_patient is not None and specified_branch):
            record = requested_patient or linked_patient
            patient = Patient.objects.select_for_update().filter(pk=record.pk).first()
            if patient is None or patient.user_id not in (None, instance.pk):
                raise ValidationError({'code': 'patient_already_linked'})
            patient.user = instance
            if specified_branch:
                patient.preferred_branch = branch
            patient.save(update_fields=['user', 'preferred_branch'])
            audit_patient(request, patient, 'update')
        return instance

    def create(self, validated_data):
        return self.save_user(get_user_model()(), validated_data)

    def update(self, instance, validated_data):
        return self.save_user(instance, validated_data)


class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = get_user_model().objects.all().order_by('username')
    serializer_class = AdminUserSerializer
    permission_classes = [AdminInBranch]
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
        list(get_user_model().objects.select_for_update(no_key=True).order_by('pk'))
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
        list(get_user_model().objects.select_for_update(no_key=True).order_by('pk'))
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
    permission_classes = [AdminInBranch]
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        target = get_object_or_404(self.get_queryset().select_for_update(), pk=self.get_object().pk)
        try:
            with transaction.atomic():
                if isinstance(target, Patient):
                    audit_patient(request, target, 'delete')
                target.delete()
        except (ProtectedError, IntegrityError):
            return Response({'code': 'protected_record'}, status=status.HTTP_409_CONFLICT)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminBranchViewSet(ResourceViewSet):
    queryset = Branch.objects.all().order_by('name', 'pk')
    serializer_class = BranchSerializer
    permission_classes = [AdminOnly]
    search_fields = ['name', 'code', 'address']

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        # Lock branches in stable order so concurrent deactivations cannot remove the last active branch.
        list(Branch.objects.select_for_update(no_key=True).order_by('pk').values_list('pk', flat=True))
        return super().update(request, *args, **kwargs)

    def perform_update(self, serializer):
        branch = serializer.instance
        if serializer.validated_data.get('is_active') is False:
            if not Branch.objects.filter(is_active=True).exclude(pk=branch.pk).exists():
                raise ValidationError({'code': 'last_branch'})
            assigned = UserBranch.objects.filter(branch=branch, user__is_active=True, user__groups__name='Pharmacist')
            if assigned.exists():
                raise ValidationError({'code': 'branch_has_staff'})
        super().perform_update(serializer)


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


class AdminPatientViewSet(AdminResourceViewSet, PatientViewSet):
    search_fields = ['reference', 'full_name']
