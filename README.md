# Chudu — Water & Sewerage Civic Reporting PWA

**Chusa, Cheppa** — See it. Report it. Fix it.

A Progressive Web App for reporting water supply and sewerage issues in Hyderabad, scoped to HMWSSB's administrative hierarchy.

## Quick Start

```bash
cd chudu
npm install
npm run dev
```

Open **https://localhost:5173** (HTTPS is required for GPS and camera on mobile).

On your phone (same Wi‑Fi), use the **Network** URL Vite prints, e.g. `https://192.168.x.x:5173`. Accept the self-signed certificate warning once — then GPS and camera will work.

## HTTPS (dev)

The dev server uses a self-signed certificate (`@vitejs/plugin-basic-ssl`):

| Where | URL |
|-------|-----|
| This machine | https://localhost:5173 |
| Phone / other device | https://\<your-lan-ip\>:5173 (from terminal output) |

Production deploys (Vercel, Netlify, etc.) already serve HTTPS.

## Features (MVP)

- **30-second report flow** — camera photo + auto GPS + category picker, no login
- **Ward auto-resolution** — point-in-polygon against GHMC ward boundaries, joined to HMWSSB hierarchy
- **Map interactions (NammaKasa-style):**
  - Colored report dots on the map — click to preview, tap card for full detail modal
  - Active / Reports counters in the Issues map toolbar
  - Pink map tint overlay on ward choropleth shading
  - Clickable ward number bubbles (opens that ward's reports)
  - Same dot-click flow on the Home map preview
- **Cascading filters** — corporation → zone → division → circle → ward, plus category/status/date
- **Accountability leaderboard** — zones, circles, divisions ranked by open issues & resolution rate
- **PWA installable** — manifest, service worker, offline tile caching
- **Offline queue** — reports saved to IndexedDB and synced when back online
- **Rate limiting** — max 5 reports/hour per device, with captcha on limit

## Data Sources

- `public/data/chudu-hierarchy-flat.json` — 292 wards with full admin chain
- `public/data/chudu-hierarchy-nested.json` — nested hierarchy for filter dropdowns
- `public/data/ghmc-wards.geojson` — ward boundaries (DataMeet / OpenStreetMap)
- `public/data/ghmc-area.geojson` — city outer boundary (dashed red outline)

## Screens

| Route | Screen |
|-------|--------|
| `/` | Home — CTA, stats, map preview |
| `/report` | Report flow |
| `/map` | Issues — Map/List toggle (NammaKasa-style), severity & status filters |
| `/list` | Same as `/map`, opens in List view |
| `/leaderboard` | Accountability rankings |
| `/my-reports` | Track your device's reports |
| `/about` | How it works |

## Tech Stack

- React 19 + Vite + TypeScript
- vite-plugin-pwa (Workbox)
- Leaflet / react-leaflet + OpenStreetMap tiles
- @turf/turf for point-in-polygon
- IndexedDB (idb) for local storage
- browser-image-compression for photo uploads

## Production Build

```bash
npm run build
npm run preview
```

Deploy `dist/` to Vercel, Netlify, or Cloudflare Pages.

## Next Steps (v2)

- Connect Supabase/Firebase for city-wide shared reports and photo storage
- Admin panel for status updates (in-progress / resolved)
- Push notifications on status change
- Telugu / Hindi language toggle

## Note on Ward Boundaries

OSM ward polygons use legacy GHMC numbering. Chudu maps them to the 2026 HMWSSB hierarchy via name aliases and nearest-ward fallback. Manual ward selection is available when auto-detection fails.
