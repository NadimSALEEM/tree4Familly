# Tree4Familly

Single-page RTL (Arabic) restaurant menu website hosted on Firebase Hosting.

The app fetches menu data from Google Sheets CSV, parses it safely, filters by venue, and renders grouped category sections.

## Architecture

```text
public/
	index.html
	js/
		main.js      # bootstrap + lifecycle
		data.js      # fetch + CSV parsing + row mapping
		state.js     # global state + derived filtering
		render.js    # UI rendering + nav + scroll tracking
	styles/
		main.css     # layout + components
		themes.css   # theme variables (res1, res2, cafe)
```

## Data Source

- Source: Google Sheets CSV (published URL inside `public/js/data.js`).
- Parsing is robust for quoted fields, escaped quotes, commas, and multiline fields.
- `variants` supports JSON array format:

```json
[
	{ "name": "Small", "price": "15000" },
	{ "name": "Large", "price": "25000" }
]
```

## Runtime Behavior

- Fetch data once on app start.
- Show loading, empty, and error states.
- Venue filtering: show only items where `item.venue` matches selected venue.
- Visibility filtering: hide items where `menu === false`.
- Categories are generated dynamically from visible items.

## Local Development

Requirements:

- Firebase CLI installed and authenticated.

Run hosting locally:

```powershell
firebase emulators:start --only hosting
```

Alternative:

```powershell
firebase serve
```

## Deploy Sanity Check

Run the pre-deploy check script:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-sanity.ps1
```

The script verifies:

- required files exist
- legacy files were removed
- Google Sheets CSV endpoint is reachable
- `firebase.json` points Hosting to `public`

## Deploy

```powershell
firebase deploy --only hosting
```
