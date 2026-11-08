# Database diagram

- `domain-erd.md`: Mermaid source with all nine domain models plus Django User, keys, cardinalities and composite unique keys.
- `domain-erd.svg`: scalable exported ERD.
Keep the Mermaid source and exported SVG in sync with schema changes.

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
