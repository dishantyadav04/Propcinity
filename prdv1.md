# Propcinity — Cursor IDE Implementation Prompt

## Context

You are working on **Propcinity** — a Next.js 15 (App Router) real estate admin platform built with TypeScript, Tailwind CSS, shadcn/ui-style components, Supabase, and Sonner toasts.

**Critical rule: Do NOT break any existing functionality. Only make the exact, surgical changes described below.**

---

## Task 1 — `BuilderForm.tsx`: Replace sliders with number inputs

**File:** `components/admin/BuilderForm.tsx`

**What to change:** In the "Builder Track Record & Legal" section, there is a `.map()` loop that renders 6 slider fields using `<input type="range">`. Replace **only those sliders** with `<input type="number">` inputs. Keep everything else (labels, value display, the `set()` handler, the field config array, the surrounding section structure) exactly as-is.

**The 6 fields to convert:**
```
total_projects_delivered  — min: 0, max: 200
on_time_delivery_percent  — min: 0, max: 100
avg_delay_months          — min: 0, max: 36
legal_cases               — min: 0, max: 10
customer_complaints       — min: 0, max: 20
refund_disputes           — min: 0, max: 10
```

**Find this exact block in the .map() loop:**
```tsx
<div key={field.key}>
  <div className="flex items-center justify-between mb-1">
    <label className="text-sm font-bold text-[var(--text-primary)]">{field.label}</label>
    <span className="text-sm font-black text-[var(--primary)]">
      {(form as any)[field.key]}{field.suffix}
    </span>
  </div>
  <input type="range" min={field.min} max={field.max}
    value={(form as any)[field.key]}
    onChange={e => set(field.key, Number(e.target.value))}
    className="w-full accent-[var(--primary)]" />
</div>
```

**Replace with:**
```tsx
<div key={field.key}>
  <label className="text-xs font-bold text-[var(--text-muted)] mb-1 block">
    {field.label}{field.suffix ? ` (${field.suffix})` : ''}
  </label>
  <input
    type="number"
    min={field.min}
    max={field.max}
    value={(form as any)[field.key]}
    onChange={e => set(field.key, Number(e.target.value))}
    className="w-full px-3 py-2.5 bg-[var(--surface-raised)] border border-[var(--border)]
      rounded-[var(--radius-xs)] text-sm focus:outline-none focus:border-[var(--primary)]"
  />
</div>
```

**Do NOT touch:** Identity section, RERA toggle, RERA ID input, handleSubmit, form state, router, imports, or any other part of the file.

---

## Task 2 — `ProjectForm.tsx`: Add searchable builder dropdown

**File:** `components/admin/ProjectForm.tsx`

**What to change:** Only the builder selection UI. Everything else must remain exactly as-is.

**Step 1 — Add state** (right after the existing `const [selectedBuilderId, ...]` line):
```tsx
const [builderSearch, setBuilderSearch] = useState('');
const [builderDropdownOpen, setBuilderDropdownOpen] = useState(false);

const filteredBuilders = builders.filter(b =>
  b.name.toLowerCase().includes(builderSearch.toLowerCase())
);

const selectedBuilderName = builders.find(b => b.id === selectedBuilderId)?.name || '';
```

**Step 2 — Find the builder `<select>` block:**
```tsx
<div className="space-y-2">
  <label className="text-sm font-bold text-[var(--text-primary)]">
    Builder <span className="text-red-500">*</span>
  </label>
  <select value={selectedBuilderId}
    onChange={e => {
      setSelectedBuilderId(e.target.value);
      const builder = builders.find(b => b.id === e.target.value);
      if (builder) {
        setProject(prev => ({ ...prev, builderName: builder.name }));
      }
    }}
    className="w-full px-3 py-2.5 bg-[var(--surface-raised)] border border-[var(--border)]
      rounded-[var(--radius-xs)] text-sm focus:outline-none focus:border-[var(--primary)]">
    <option value="">Select a builder...</option>
    {builders.map(b => (
      <option key={b.id} value={b.id}>
        {b.name}
      </option>
    ))}
  </select>
</div>
```

**Replace with this searchable combobox:**
```tsx
<div className="space-y-2">
  <label className="text-sm font-bold text-[var(--text-primary)]">
    Builder <span className="text-red-500">*</span>
  </label>
  <div className="relative">
    <input
      type="text"
      value={builderDropdownOpen ? builderSearch : selectedBuilderName}
      onChange={e => {
        setBuilderSearch(e.target.value);
        setBuilderDropdownOpen(true);
      }}
      onFocus={() => {
        setBuilderSearch('');
        setBuilderDropdownOpen(true);
      }}
      onBlur={() => setTimeout(() => setBuilderDropdownOpen(false), 150)}
      placeholder="Search or select a builder..."
      className="w-full px-3 py-2.5 bg-[var(--surface-raised)] border border-[var(--border)]
        rounded-[var(--radius-xs)] text-sm focus:outline-none focus:border-[var(--primary)] pr-8"
    />
    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
      ▾
    </span>
    {builderDropdownOpen && (
      <div className="absolute z-50 mt-1 w-full bg-white border border-[var(--border)]
        rounded-[var(--radius-xs)] shadow-lg max-h-52 overflow-y-auto">
        <div
          onMouseDown={() => {
            setSelectedBuilderId('');
            setProject(prev => ({ ...prev, builderName: '' }));
            setBuilderDropdownOpen(false);
            setBuilderSearch('');
          }}
          className="px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-raised)] cursor-pointer"
        >
          — Clear selection —
        </div>
        {filteredBuilders.length === 0 ? (
          <div className="px-3 py-2 text-sm text-[var(--text-muted)]">No builders found</div>
        ) : (
          filteredBuilders.map(b => (
            <div
              key={b.id}
              onMouseDown={() => {
                setSelectedBuilderId(b.id);
                setProject(prev => ({ ...prev, builderName: b.name }));
                setBuilderDropdownOpen(false);
                setBuilderSearch('');
              }}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-[var(--surface-raised)] transition-colors ${
                selectedBuilderId === b.id
                  ? 'font-bold text-[var(--primary)] bg-[var(--surface-raised)]'
                  : 'text-[var(--text-primary)]'
              }`}
            >
              {b.name}
            </div>
          ))
        )}
      </div>
    )}
  </div>
</div>
```

**Do NOT touch:** Any other form section, state, handlers, submit logic, or imports.

---

## Task 3 — Fix `react-leaflet` build error + deprecated `unload` listener

**Root cause:** `react-leaflet` uses browser-only APIs. Next.js SSR tries to bundle it server-side and fails. The `unload` listener warning also comes from Leaflet being loaded in SSR context.

**Fix: Split AdminMapPreview into two files.**

### File A — Create `components/admin/AdminMapPreviewInner.tsx` (NEW FILE):
```tsx
'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  lat: number;
  lng: number;
}

function RecenterMap({ lat, lng }: Props) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export default function AdminMapPreviewInner({ lat, lng }: Props) {
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
      zoom={15}
      scrollWheelZoom={false}
      zoomControl={false}
      attributionControl={false}
      className="h-full w-full"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[lat, lng]} />
      <RecenterMap lat={lat} lng={lng} />
    </MapContainer>
  );
}
```

### File B — Overwrite `components/admin/AdminMapPreview.tsx` (REPLACE ENTIRE FILE):
```tsx
'use client';

import dynamic from 'next/dynamic';

interface AdminMapPreviewProps {
  lat: number;
  lng: number;
}

// ssr: false prevents Next.js from importing react-leaflet on the server,
// which fixes the "Module not found" build error and the deprecated
// unload event listener warning from Leaflet's internal event system.
const AdminMapPreviewInner = dynamic(
  () => import('./AdminMapPreviewInner'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[200px] w-full rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center">
        <span className="text-xs text-[var(--text-muted)]">Loading map…</span>
      </div>
    ),
  }
);

export default function AdminMapPreview({ lat, lng }: AdminMapPreviewProps) {
  return (
    <div className="h-[200px] w-full rounded-lg overflow-hidden border border-[var(--border)] relative z-10">
      <AdminMapPreviewInner lat={lat} lng={lng} />
    </div>
  );
}
```

**The import in `ProjectForm.tsx` stays unchanged** — `import AdminMapPreview from "./AdminMapPreview"` — because the public API is identical.

---

## To-Do Checklist

```
[ ] Task 1 — BuilderForm.tsx
    [ ] Find the .map() block rendering 6 <input type="range"> sliders
    [ ] Replace each slider div with a number input div (exact code above)
    [ ] Verify: all 6 fields show number inputs with correct min/max
    [ ] Verify: no other part of BuilderForm.tsx changed

[ ] Task 2 — ProjectForm.tsx
    [ ] Add 4 new state/derived lines after selectedBuilderId declaration
    [ ] Find and replace the <select> builder block with searchable combobox
    [ ] Verify: typing in the input filters the dropdown list
    [ ] Verify: selecting a builder sets both selectedBuilderId and builderName
    [ ] Verify: edit page shows the current builder name pre-filled
    [ ] Verify: all other form sections are completely untouched

[ ] Task 3 — AdminMapPreview (build fix)
    [ ] Create components/admin/AdminMapPreviewInner.tsx (new file, full content above)
    [ ] Replace entire components/admin/AdminMapPreview.tsx with dynamic() wrapper
    [ ] No changes to any imports in ProjectForm.tsx or page files

[ ] Verification
    [ ] npm run build → zero "Module not found: react-leaflet" errors
    [ ] npm run build → zero deprecated unload listener warnings
    [ ] npm run dev → /admin/builders/new shows number inputs for Track Record
    [ ] npm run dev → /admin/projects/new builder search filters correctly
    [ ] npm run dev → /admin/projects/[id]/edit pre-fills builder name
    [ ] npm run dev → Map renders correctly, no console errors
```

---

## Guard Rails — Do NOT change these

- Any API route under `app/api/`
- Any page file under `app/admin/`
- `UnitConfigForm.tsx`, `AmenityLibraryManager.tsx`, `NearbyLocationsForm.tsx`, `ImageUpload.tsx`, `Sidebar.tsx`
- `package.json` — all packages needed (`react-leaflet`, `leaflet`) are already installed
- TypeScript types, `Project` interface, Supabase queries, auth logic, toast config
- CSS variables, Tailwind config, global styles
- The shape of data sent in `handleSubmit` / API body — only the UI input type changes, not the data