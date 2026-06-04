# Propcinity — Fix: "Map container is being reused by another instance"

> Paste this entire prompt into Cursor Composer. It is a single, self-contained fix.

---

## Error

```
Map container is being reused by another instance
```

Seen in the browser DevTools console on any page that renders a map.

---

## Root Cause (read before touching any code)

Three things combine to cause this:

### Cause 1 — React 19 Strict Mode double-invoke
`next.config.mjs` has `reactStrictMode: true`. In development, React 19 Strict Mode intentionally **mounts → unmounts → remounts** every component to surface side-effect bugs. Leaflet's `MapContainer` writes a `_leaflet_id` property directly onto its DOM node when it mounts. On the Strict Mode remount, Leaflet finds the **same DOM node** still carrying the old `_leaflet_id` and throws the error.

### Cause 2 — The cleanup in `ProjectMapInner.tsx` is broken
The current `useEffect` cleanup tries to null out `_leaflet_id` via:
```ts
document.querySelectorAll('.leaflet-container').forEach((el: any) => {
  if (el._leaflet_id) el._leaflet_id = null;
});
```
This runs **too late** (Leaflet throws before the cleanup fires) and also **targets every map on the page globally** rather than the specific container being unmounted. It does not prevent the error.

### Cause 3 — `MapView.tsx` imports `ProjectMapInner` directly (not via `dynamic`)
`LocationSection` wraps `MapView` in a `dynamic(ssr: false)` import, but `MapView` then imports `ProjectMapInner` synchronously. This means the Strict Mode double-invoke still reaches `ProjectMapInner` with the same DOM node.

### The correct fix
Use React's `useId()` hook to generate a **stable, unique ID per component instance** and pass it as the `key` prop on `<MapContainer>`. When React Strict Mode unmounts and remounts the component, the `key` stays the same value — but because the `key` is on `MapContainer` itself, React treats the second mount as a fresh component and creates a **brand new DOM node** for it. The new DOM node has no `_leaflet_id`, so Leaflet initialises cleanly. No global DOM querying needed.

---

## To-Do Checklist

### Task 1 — Fix `components/map/ProjectMapInner.tsx`

Replace the **entire file** with the following:

```tsx
'use client';

import { useEffect, useId } from 'react';
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
  // useId() returns a stable, unique string for this component instance.
  // Passing it as the `key` on MapContainer ensures React creates a fresh
  // DOM node on every Strict Mode remount instead of reusing the old one
  // that still has Leaflet's _leaflet_id stamped on it.
  const mapId = useId();

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
      key={mapId}
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

**What changed vs the old file:**
- Added `useId` to the import from `'react'`
- Added `const mapId = useId();` inside the component
- Added `key={mapId}` to `<MapContainer>`
- Removed the broken `return () => { document.querySelectorAll(...) }` cleanup entirely

---

### Task 2 — Fix `components/map/MapView.tsx`

`MapView` currently imports `ProjectMapInner` directly (synchronous). This means `LocationSection`'s `dynamic(ssr: false)` wrapper only prevents SSR for `MapView` itself — `ProjectMapInner` is still resolved synchronously inside it and is subject to Strict Mode double-invoke on the client.

Wrap the import inside `MapView` with its own `dynamic` to ensure `ProjectMapInner` is always treated as a client-only, lazily-loaded module:

Replace the **entire file** with:

```tsx
'use client';

import dynamic from 'next/dynamic';
import Skeleton from '@/components/ui/Skeleton';

interface MapViewProps {
  lat: number;
  lng: number;
  projectName: string;
  priceLabel: string;
  zoom?: number;
  className?: string;
}

const ProjectMapInner = dynamic(
  () => import('./ProjectMapInner'),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full rounded-[var(--radius)]" />,
  }
);

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

**What changed vs the old file:**
- Removed `import ProjectMapInner from './ProjectMapInner'`
- Added `import dynamic from 'next/dynamic'` and `import Skeleton from '@/components/ui/Skeleton'`
- `ProjectMapInner` is now loaded via `dynamic({ ssr: false })` — identical pattern to `LocationSection → MapView` and `ProjectMapPreview → ProjectMapInner`

---

### Task 3 — Keep `next.config.mjs` untouched

Do **not** set `reactStrictMode: false` as a workaround. The fix in Tasks 1 and 2 is the correct solution. Strict Mode should stay enabled — it catches real bugs and the `useId` + `key` pattern is the documented React + Leaflet approach for this exact problem.

---

## File Summary

| File | Change |
|------|--------|
| `components/map/ProjectMapInner.tsx` | Add `useId`, pass `key={mapId}` to `<MapContainer>`, remove broken global DOM cleanup |
| `components/map/MapView.tsx` | Switch `ProjectMapInner` from a direct import to `dynamic({ ssr: false })` |
| `next.config.mjs` | **No change** — `reactStrictMode: true` stays as-is |

---

## Verification Checklist

- [ ] Open browser DevTools console
- [ ] Navigate to any project detail page (`/projects/[slug]`)
- [ ] The **Location** section map loads without any console error
- [ ] Navigate away and back — map reloads without error
- [ ] Open the admin **Add/Edit Project** page — the map preview in the Geography section loads without error
- [ ] Hard-refresh the page — no error on initial load
- [ ] **Zero** instances of `"Map container is being reused"` in the console at any point