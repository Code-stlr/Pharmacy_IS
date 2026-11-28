"""Apply the four branch locations supplied by the project owner on 2026-11-28.

Coordinates come from the Directions links on the cited 2GIS pages (longitude, latitude).
These are project branch locations at the supplied landmarks, not claims of real pharmacies.
"""
from decimal import Decimal
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from pharmacy.models import Branch


LOCATIONS = {
    "MAIN": ("Алматы, улица Розыбакиева, 247а (MEGA Alma-Ata)", "43.202959", "76.892411", "https://2gis.kz/almaty/geo/9430047375042432"),
    "Tole-bi-1": ("Алматы, улица Толе би, 59 (площадь Астана)", "43.255628", "76.943119", "https://2gis.kz/almaty/geo/9430047375011144"),
    "Tastak-1": ("Алматы, улица Тургут Озала, 80 к5", "43.252241", "76.880888", "https://2gis.kz/almaty/geo/9430047374979960"),
    "dostyq-1": ("Алматы, микрорайон Самал-2, 111 (Dostyk Plaza)", "43.233057", "76.957123", "https://2gis.kz/almaty/geo/9430047375172127"),
}


class Command(BaseCommand):
    help = "Configure the existing four project branches with the owner-approved Almaty addresses and 2GIS coordinates."

    @transaction.atomic
    def handle(self, *args, **options):
        branches = {branch.code: branch for branch in Branch.objects.select_for_update().filter(code__in=LOCATIONS).order_by("pk")}
        missing = set(LOCATIONS) - set(branches)
        if missing:
            raise CommandError("No changes made. Missing branch codes: " + ", ".join(sorted(missing)))
        for code, (address, latitude, longitude, _) in LOCATIONS.items():
            branch = branches[code]
            branch.address, branch.latitude, branch.longitude = address, Decimal(latitude), Decimal(longitude)
            branch.full_clean()
            branch.save(update_fields=["address", "latitude", "longitude"])
        self.stdout.write(self.style.SUCCESS("Configured addresses and coordinates for all four existing branches."))
