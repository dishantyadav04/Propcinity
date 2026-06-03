# Propcinity — Map Section & Dependency Fix: Cursor Prompt

> **Paste this entire prompt into Cursor's chat (or Composer) and it will guide the implementation step-by-step.**

---

## Context

This is a **Next.js 15 + React 19** project (`propiq`) using `react-leaflet` for maps. The project currently has:

- `react-leaflet@4.2.1` — incompatible with React 19 (only supports `^18.0.0`), causing 8 npm audit vulnerabilities (4 moderate, 4 high) and breaking peer-dep resolution.
- The **project detail page** (`app/projects/[slug]/page.tsx`) renders the `LocationSection` (map) only inside the `#section-location` tab area — it should also appear above `#section-amenities`.
- The **project page map** uses a custom `MapView` component with a CartoDB tile style, but the **admin project add/edit page** uses a simpler, cleaner `AdminMapPreview` → `AdminMapPreviewInner` component. We want to unify these to use a single shared map component with the standard OpenStreetMap tile layout.
- There are console errors from the React 19 + Leaflet version mismatch.

---

## To-Do Checklist

### 1. Fix npm vulnerabilities — upgrade `react-leaflet` to React 19-compatible version

- [ ] Uninstall the old incompatible packages:
  ```bash
  npm uninstall react-leaflet @react-leaflet/core
  ```
- [ ] Install the latest `react-leaflet` v5 (which supports React 19):
  ```bash
  npm install react-leaflet@latest @react-leaflet/core@latest
  ```
- [ ] Verify no peer-dep errors:
  ```bash
  npm install
  npm audit
  ```
- [ ] In `package.json`, confirm `react-leaflet` version is `^5.x.x` and `@react-leaflet/core` is `^5.x.x`.

> **Note:** `react-leaflet` v5 dropped the legacy `react@^18` peer dep — it now fully supports React 19. The API is backward-compatible for `MapContainer`, `TileLayer`, `Marker`, `Popup`, `useMap`. No component code changes are needed just for the version bump.

---

### 2. Create a unified `ProjectMapInner.tsx` component (SSR-safe, shared)

Create a new file: `components/map/ProjectMapInner.tsx`

This component should:
- Import `react-leaflet` (`MapContainer`, `TileLayer`, `Marker`, `useMap`) and `leaflet`
- Import `leaflet/dist/leaflet.css`
- Fix the Leaflet default icon paths in a `useEffect` (same fix already in `AdminMapPreviewInner`)
- Accept props: `lat: number`, `lng: number`, `projectName?: string`, `priceLabel?: string`, `zoom?: number`
- Use the **standard OpenStreetMap tile URL**: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`  
  *(NOT the CartoDB light style currently in `MapView.tsx`)*
- Include a `RecenterMap` sub-component (same pattern as `AdminMapPreviewInner`) that calls `map.setView([lat, lng])` via `useMap` whenever lat/lng change
- If `projectName` and `priceLabel` are provided, render the custom `ProjectMarker` (pill-style orange marker from `components/map/ProjectMarker.tsx`)
- If not provided, fall back to a plain `<Marker position={[lat, lng]} />`
- Keep `scrollWheelZoom={false}` and `attributionControl={false}` for clean UI

```tsx
// components/map/ProjectMapInner.tsx
'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ProjectMarker from '@/components/map/ProjectMarker';

interface Props {
  lat: number;
  lng: number;
  projectName?: string;
  priceLabel?: string;
  zoom?: number;
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export default function ProjectMapInner({ lat, lng, projectName, priceLabel, zoom = 15 }: Props) {
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
  }, []);

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={zoom}
      scrollWheelZoom={false}
      attributionControl={false}
      className="h-full w-full"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {projectName && priceLabel
        ? <ProjectMarker lat={lat} lng={lng} name={projectName} priceLabel={priceLabel} />
        : <Marker position={[lat, lng]} />
      }
      <RecenterMap lat={lat} lng={lng} />
    </MapContainer>
  );
}
```

---

### 3. Create a shared `ProjectMapPreview.tsx` wrapper (dynamic import, no SSR)

Create: `components/map/ProjectMapPreview.tsx`

This is the dynamic-import wrapper (like `AdminMapPreview` but for project pages) — it dynamically loads `ProjectMapInner` with `ssr: false`.

Props:
- `lat: number`
- `lng: number`
- `projectName?: string`
- `priceLabel?: string`
- `height?: string` — defaults to `'320px'`
- `zoom?: number`

```tsx
// components/map/ProjectMapPreview.tsx
'use client';

import dynamic from 'next/dynamic';
import Skeleton from '@/components/ui/Skeleton';

interface ProjectMapPreviewProps {
  lat: number;
  lng: number;
  projectName?: string;
  priceLabel?: string;
  height?: string;
  zoom?: number;
}

const ProjectMapInner = dynamic(
  () => import('./ProjectMapInner'),
  {
    ssr: false,
    loading: () => (
      <div
        style={{ height: '320px' }}
        className="w-full rounded-[var(--radius)] bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center"
      >
        <span className="text-xs text-[var(--text-muted)]">Loading map…</span>
      </div>
    ),
  }
);

export default function ProjectMapPreview({
  lat,
  lng,
  projectName,
  priceLabel,
  height = '320px',
  zoom = 15,
}: ProjectMapPreviewProps) {
  return (
    <div
      style={{ height }}
      className="w-full rounded-[var(--radius)] overflow-hidden border border-[var(--border)] relative z-10"
    >
      <ProjectMapInner lat={lat} lng={lng} projectName={projectName} priceLabel={priceLabel} zoom={zoom} />
    </div>
  );
}
```

---

### 4. Update `AdminMapPreviewInner.tsx` to use `ProjectMapInner`

Replace the contents of `components/admin/AdminMapPreviewInner.tsx` to simply re-export `ProjectMapInner` — no need for duplicate code:

```tsx
// components/admin/AdminMapPreviewInner.tsx
export { default } from '@/components/map/ProjectMapInner';
```

This keeps `AdminMapPreview.tsx` working exactly as before without changes, while both admin and project pages now use the same underlying map.

---

### 5. Update `MapView.tsx` to use `ProjectMapInner`

Replace `components/map/MapView.tsx` — keep the component name and props signature the same so `LocationSection` still works, but replace the internals to use the unified `ProjectMapInner`:

- Remove the duplicate icon-fix logic
- Remove the duplicate `fetchPlaces` call (that already happens in `LocationSection`)
- Use `ProjectMapInner` directly (it's already dynamically loaded via `LocationSection`'s wrapping)
- Change the tile URL to standard OSM (already handled inside `ProjectMapInner`)

```tsx
// components/map/MapView.tsx
'use client';

import ProjectMapInner from './ProjectMapInner';

interface MapViewProps {
  lat: number;
  lng: number;
  projectName: string;
  priceLabel: string;
  zoom?: number;
  className?: string;
}

export default function MapView({ lat, lng, projectName, priceLabel, zoom = 14 }: MapViewProps) {
  return (
    <div className="space-y-1">
      <div className="h-[300px] w-full rounded-[var(--radius)] overflow-hidden border border-[var(--border)] relative z-10">
        <ProjectMapInner lat={lat} lng={lng} projectName={projectName} priceLabel={priceLabel} zoom={zoom} />
      </div>
      <p className="text-[10px] text-[var(--text-muted)] text-right">
        Map data © OpenStreetMap contributors
      </p>
    </div>
  );
}
```

---

### 6. Add map section above amenities in `app/projects/[slug]/page.tsx`

In the project detail page, locate the `{/* ── AMENITIES ──────────────────────────── */}` section (div with `id="section-amenities"`).

**Immediately before** that section, add a new map preview block:

```tsx
{/* ── MAP PREVIEW (above amenities) ───────── */}
{project.lat && project.lng && (
  <div className="py-8 border-b border-[var(--border)]">
    <div className="flex items-center justify-between mb-4">
      <h2
        className="text-lg font-black text-[var(--text-primary)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Location
      </h2>
      <a
        href={`https://maps.google.com/?q=${project.lat},${project.lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] hover:underline"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        Open in Maps
      </a>
    </div>
    <p className="text-sm text-[var(--text-muted)] mb-3">
      {project.location}, {project.city}
    </p>
    <ProjectMapPreview
      lat={project.lat}
      lng={project.lng}
      projectName={project.name}
      priceLabel={formatINR(minPrice)}
      height="280px"
      zoom={15}
    />
  </div>
)}
```

Also add the import at the top of the file:
```tsx
import ProjectMapPreview from '@/components/map/ProjectMapPreview';
```

And ensure `ExternalLink` is imported from `lucide-react` (it's already in `LocationSection` but needs to be in the page too):
```tsx
import { ..., ExternalLink } from 'lucide-react';
```

---

### 7. Fix console errors

The main console errors come from:

**a) Leaflet SSR error** — `window is not defined` or `document is not defined`  
Already resolved by the `ssr: false` dynamic import pattern in `ProjectMapPreview` and the existing `LocationSection` → `MapView` dynamic import.

**b) `_leaflet_id` duplicate container error** in React 19 Strict Mode  
Add a cleanup in `ProjectMapInner`:
```tsx
// In ProjectMapInner.tsx useEffect cleanup:
useEffect(() => {
  // icon fix...
  return () => {
    // Clear any dangling leaflet container IDs on unmount (React 19 Strict Mode)
    document.querySelectorAll('.leaflet-container').forEach((el: any) => {
      if (el._leaflet_id) el._leaflet_id = null;
    });
  };
}, []);
```

**c) `react-leaflet` peer dep mismatch warnings** — fully resolved by step 1 (upgrading to v5).

**d) Missing CSS for Leaflet markers** — already handled by importing `leaflet/dist/leaflet.css` inside `ProjectMapInner.tsx`.

---

### 8. Verify the full flow

- [ ] Run `npm run dev` — no console errors about Leaflet or React peer deps
- [ ] Visit a project detail page (`/projects/[slug]`)
- [ ] Confirm map appears **above the Amenities section** (new compact map block)
- [ ] Confirm the **Location tab** still shows the full `LocationSection` with the Map/Nearby toggle
- [ ] Confirm the admin **add/edit project page** still shows the map preview correctly
- [ ] Confirm both maps use **standard OSM tiles** (not CartoDB)
- [ ] Run `npm audit` — should show 0 vulnerabilities

---

## File Summary

| File | Action |
|------|--------|
| `package.json` | Upgrade `react-leaflet` + `@react-leaflet/core` to v5 |
| `components/map/ProjectMapInner.tsx` | **NEW** — unified inner map component (SSR-unsafe) |
| `components/map/ProjectMapPreview.tsx` | **NEW** — dynamic wrapper for project pages |
| `components/map/MapView.tsx` | **REPLACE** — delegate to `ProjectMapInner` |
| `components/admin/AdminMapPreviewInner.tsx` | **REPLACE** — re-export `ProjectMapInner` |
| `app/projects/[slug]/page.tsx` | **EDIT** — add map block above amenities, import `ProjectMapPreview` |

---

## Notes for Cursor

- Do **not** change `components/admin/AdminMapPreview.tsx` — it stays as-is.
- Do **not** change `components/map/LocationSection.tsx` — it stays as-is (still uses `MapView` which now delegates to `ProjectMapInner`).
- Do **not** change `components/map/ProjectMarker.tsx` or `components/map/NearbyMarker.tsx`.
- The `react-leaflet` v5 → v4 API is mostly backward-compatible. If Cursor sees any import differences after upgrading (e.g., `@react-leaflet/core` internal hooks), update usages accordingly.
- Keep `'use client'` directive on all map components.
- All map containers need explicit height set (via className or inline style) — Leaflet requires a non-zero height.