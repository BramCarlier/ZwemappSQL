# Zwemapp Static Student Viewer

This package contains a static mobile-first viewer generated from the uploaded SQL dump.

## Included
- `index.html`
- `styles.css`
- `app.js`
- `data/zwemapp-view.json`

## What it shows
- student name
- school name
- class name
- group / level / cap
- group moment (day + time)
- class moment

## Features
- search
- filters
- tabs
- mobile cards + desktop table
- schedule grouping
- school/class relation overview
- static hosting only (no update/delete API calls)

## Hosting
### GitHub Pages
Upload the contents of this folder to a repo and enable Pages.

### Laravel Forge / any web server
Serve the folder as static files. The app uses relative paths.

## Notes
The JSON export only contains the reduced fields needed for read-only browsing.
