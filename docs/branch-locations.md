# Branch addresses and nearest-branch selection

The owner supplied these four locations on 2026-11-28. Addresses were checked against the linked 2GIS listings. Coordinates were read from each listing's **Directions** link; 2GIS encodes them as longitude, latitude. These identify the project's fictional pharmacy branches at the supplied landmarks and do not assert that those landmarks operate real pharmacy branches.

| Branch code | Address in Almaty | Latitude | Longitude | Source |
|---|---|---|---|---|
| MAIN | улица Розыбакиева, 247а — MEGA Alma-Ata | 43.202959 | 76.892411 | [2GIS](https://2gis.kz/almaty/geo/9430047375042432) |
| Tole-bi-1 | улица Толе би, 59 — площадь Астана | 43.255628 | 76.943119 | [2GIS](https://2gis.kz/almaty/geo/9430047375011144) |
| Tastak-1 | улица Тургут Озала, 80 к5 | 43.252241 | 76.880888 | [2GIS](https://2gis.kz/almaty/geo/9430047374979960) |
| dostyq-1 | микрорайон Самал-2, 111 — Dostyk Plaza | 43.233057 | 76.957123 | [2GIS](https://2gis.kz/almaty/geo/9430047375172127) |

## User flow

New patients can click **Use my location** while completing their profile. Existing patients can open **My profile → Change preferred branch**. Staff editing a patient's preferred branch use the same picker.

The browser asks permission only after this button is clicked. Coordinates are used in browser memory to compare active, configured branches with the Haversine formula. Only the selected branch ID is submitted and saved. Distance is approximate and measured in a straight line; it does not account for traffic, roads, entrances, opening hours or medication availability. Users can select a different branch manually or leave the preference empty. A manual choice overrides a delayed location response.

Permission refusal, timeout, unsupported browsers and missing branch coordinates leave manual selection available. Locations require HTTPS or localhost. No 2GIS runtime API key, automatic IP lookup or user-location database is used.

The preference does not limit access to shared patient records, change staff assignments or move inventory. A patient can change only their own preferred branch/phone through `/api/auth/patient/`; identity and clinical fields remain protected.

## Administration

In **Admin → Branches**, edit the address, latitude and longitude. Enter decimal degrees with a dot, for example `43.202959`, `76.892411`. Latitude must be between -90 and 90; longitude between -180 and 180. Supply both coordinates together and an address, or leave both coordinates empty. Inactive branches are excluded from location suggestions.

Migration `0007_branch_address_branch_latitude_branch_longitude_and_more` adds these fields and the database coordinate constraint without changing branch IDs. To apply the original four owner-approved addresses to existing branch codes, run:

```powershell
python manage.py configure_branch_locations
```

Run this from `backend` with the intended database environment loaded. The command validates all four branch codes first and updates only their address/coordinates in a transaction; it does not create branches, rename them or change patient links. It overwrites current location fields, so use it only when intentionally restoring the table above. Later edits should use the admin interface.

## Verification

Automated checks cover known coordinates near each of the four branches, decimal-string coordinates, inactive/unconfigured branches, invalid locations, globe boundaries, denied permission, timeouts, manual overrides, form submission of branch IDs only, coordinate validation/constraints, admin permissions and self-service patient preference changes. The normal frontend build, dictionary parity tests and backend regression suite also apply.

On 2026-11-28 the migration and four-branch configuration were applied to Neon after validating a full application-schema backup. The backup and before/after evidence are in `.private/database-migration/branch-locations-20261128T080011Z/`. All four existing branch IDs/names were preserved, as were the four users, 106 patients, 103 prescriptions and 115 stock batches.

Verification passed: 75 backend tests plus 26 subtests, 21 frontend tests, the production frontend build, API schema validation with `--validate --fail-on-warn`, and a browser check of all four addresses and the enabled location picker. Geolocation success/refusal/timeout cases used simulated browser coordinates; no device location was collected during verification. Changes are available locally; no Azure deployment or GitHub push was performed.
