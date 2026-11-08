# Diagram evidence

- `domain-erd.md`: Mermaid source with all nine domain models plus Django User, keys, cardinalities and composite unique keys.
- `domain-erd.svg`: scalable exported ERD.
- `use-cases.svg`: UML rectangular actor notation, system boundary and eight implemented use-case groups.
- `wireframe-patient-search.svg`, `wireframe-prescription-entry.svg`, `wireframe-dispensing.svg`: retrospective low-fidelity screen artifacts dated 2026-11-08.

These exports were visually inspected. They describe the current MVP and must not be presented as proof of artifacts produced during the original Weeks 2–4.

## Re-export

Install Node 24 and a local Chromium browser, then from the repository root:

```powershell
$env:PUPPETEER_SKIP_DOWNLOAD='true'
npm install --prefix .build/diagrams @mermaid-js/mermaid-cli@12.2.0
$env:DIAGRAM_BROWSER='C:\path\to\chrome.exe'
node scripts/export-diagrams.mjs
node scripts/render-evidence.mjs
```

The preview step requires the frontend Playwright installation and its Chromium browser. Build dependencies and previews remain ignored in `.build/`. Review every export after changing the schema or diagram source.
