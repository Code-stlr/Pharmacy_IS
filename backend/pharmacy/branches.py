from rest_framework.exceptions import PermissionDenied

from .models import Branch, MAIN_BRANCH_CODE, Patient, PatientAccessLog, UserBranch


def role(user):
    if not user.is_authenticated:
        return None
    if user.is_superuser or user.groups.filter(name="Admin").exists():
        return "Admin"
    if user.groups.filter(name="Pharmacist").exists():
        return "Pharmacist"
    if user.groups.filter(name="Patient").exists():
        return "Patient"
    return None


def default_branch():
    available = Branch.objects.filter(is_active=True)
    return available.filter(code=MAIN_BRANCH_CODE).first() or available.order_by("name", "pk").first()


def account_branch(request, user, current_role):
    if current_role == "Admin":
        selected = request.session.get("active_branch_id")
        if selected:
            branch = Branch.objects.filter(pk=selected, is_active=True).first()
            if branch:
                return branch
        return default_branch()
    if current_role == "Pharmacist":
        assignment = UserBranch.objects.select_related("branch").filter(user=user, branch__is_active=True).first()
        return assignment.branch if assignment else None
    if current_role == "Patient":
        patient = Patient.objects.select_related("preferred_branch").filter(user=user, preferred_branch__is_active=True).first()
        return patient.preferred_branch if patient else None
    return None


def operating_branch(request, current_role):
    """Pin staff requests to the location shown when the action was started."""
    if current_role not in ("Admin", "Pharmacist"):
        return None
    supplied = request.headers.get("X-Pharmacy-Branch")
    if supplied is not None:
        if not supplied.isascii() or not supplied.isdecimal() or len(supplied) > 19 or not 0 < int(supplied) <= 2**63 - 1:
            raise PermissionDenied({"code": "branch_unavailable"})
        selected = Branch.objects.filter(pk=int(supplied), is_active=True).first()
        if selected is None:
            raise PermissionDenied({"code": "branch_unavailable"})
        if current_role == "Admin":
            return selected
    branch = account_branch(request, request.user, current_role)
    if branch is None:
        raise PermissionDenied({"code": "branch_required"})
    if supplied is not None and selected.pk != branch.pk:
        raise PermissionDenied({"code": "branch_mismatch"})
    return branch


def audit_patient(request, patient, action):
    branch = getattr(request, "operating_branch", None)
    if branch is not None and request.method != "HEAD":
        PatientAccessLog.objects.create(patient=patient, actor=request.user, branch=branch, action=action)
