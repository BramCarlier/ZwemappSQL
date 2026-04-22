# Zwemapp Static Viewer

This folder contains a lightweight, read-only viewer extracted from the SQL dump.

## Files
- `index.html` — static mobile-first viewer
- `data.json` — distilled data subset used by the viewer

## What it shows
- student name
- school and class
- linked group / level
- group/class moment (day + time)
- filterable tables for students, classes, schools, groups, and levels

## Deploy
### GitHub Pages
Serve this folder as-is.

### Laravel Forge
Copy the folder into a public directory, for example:
- `/home/forge/your-site/public/zwemapp-viewer/`

Then open:
- `/zwemapp-viewer/index.html`

No API or write calls are used.
