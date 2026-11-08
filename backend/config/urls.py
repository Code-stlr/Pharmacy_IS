from django.db import connection, DatabaseError
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from pharmacy import api, auth
from drf_spectacular.utils import extend_schema
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@extend_schema(responses={200: dict, 503: dict}, auth=[])
@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except DatabaseError:
        return Response({"status": "unavailable"}, status=503)
    return Response({"status": "ok"})


router = DefaultRouter()
for prefix, view in [("patients", api.PatientViewSet), ("categories", api.CategoryViewSet), ("suppliers", api.SupplierViewSet), ("doctors", api.DoctorViewSet), ("medications", api.MedicationViewSet), ("batches", api.BatchViewSet), ("prescriptions", api.PrescriptionViewSet), ("dispensings", api.DispensingViewSet)]:
    router.register(prefix, view)

urlpatterns = [
    path("api/auth/csrf/", auth.csrf),
    path("api/auth/login/", auth.LoginView.as_view()),
    path("api/auth/register/", auth.RegisterView.as_view()),
    path("api/auth/logout/", auth.LogoutView.as_view()),
    path("api/auth/me/", auth.MeView.as_view()),
    path("api/auth/patient/", auth.MyPatientView.as_view()),
    path("api/", include(router.urls)),
    path("api/health/", health),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema")),
]
