# Propcinity — Implementation Prompt for Cursor / Claude Code

Paste this entire prompt into Cursor (Agent mode) or Claude Code. It is self-contained and covers every change needed. Do NOT change anything not listed here — the rest of the codebase must keep working.

---

## Context

This is a Next.js 14 App Router project (TypeScript, Tailwind, Supabase, Framer Motion, shadcn/ui). The main property detail page is `app/projects/[slug]/page.tsx`. Admin forms are in `components/admin/`. Styling uses CSS variables via `var(--primary)`, `var(--border)`, etc.

---

## TASK 1 — Update `types/project.ts`

Add these two new interfaces **before** the `Project` interface, and add the new fields into `Project`:

```ts
// Add before Project interface:
export interface ManualNearbyLocation {
  id: string
  name: string
  category: 'school' | 'hospital' | 'mall' | 'metro' | 'it_park' | 'park' | 'restaurant' | 'bank' | 'pharmacy' | 'other'
  distance: string   // e.g. "700m", "1.2 km"
}

export interface AmenityLibraryItem {
  id: string
  name: string
  icon: string       // emoji
  category: 'internal' | 'external' | 'both'
}
```

Inside the `Project` interface add:

```ts
nearbyLocations?: ManualNearbyLocation[]
```

(Place it directly after `internalAmenities?` and `externalAmenities?`)

---

## TASK 2 — Update `services/projects.ts`

In the `mapProject` function, after the `videos` and `brochureUrl` lines, add:

```ts
nearbyLocations: row.nearby_locations || [],
```

---

## TASK 3 — Rewrite `components/map/LocationSection.tsx`

Replace the entire file with the following. It splits into two sub-tabs: **Map** and **Nearby Locations**. The Nearby Locations tab shows manual admin-entered locations (from `project.nearbyLocations`) alongside the auto-fetched Overpass ones. Remove any 3D / 360 view — do not add it.

```tsx
'use client';

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { NearbyPlace } from "@/lib/overpass";
import { ManualNearbyLocation } from "@/types/project";
import NearbyPlacesList from "@/components/map/NearbyPlacesList";
import Skeleton from "@/components/ui/Skeleton";
import { MapPin, Navigation } from "lucide-react";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => <Skeleton className="h-[320px] w-full rounded-[var(--radius)]" />
});

const CATEGORY_ICONS: Record<ManualNearbyLocation['category'], string> = {
  school: '🏫', hospital: '🏥', mall: '🛍️', metro: '🚇',
  it_park: '💼', park: '🌳', restaurant: '🍽️', bank: '🏦',
  pharmacy: '💊', other: '📍',
};

const CATEGORY_LABELS: Record<ManualNearbyLocation['category'], string> = {
  school: 'School', hospital: 'Hospital', mall: 'Mall', metro: 'Metro / Transit',
  it_park: 'IT Park', park: 'Park', restaurant: 'Restaurant', bank: 'Bank',
  pharmacy: 'Pharmacy', other: 'Nearby',
};

interface LocationSectionProps {
  lat: number;
  lng: number;
  projectName: string;
  priceLabel: string;
  location: string;
  city: string;
  nearbyLocations?: ManualNearbyLocation[];
}

export default function LocationSection({
  lat, lng, projectName, priceLabel, location, city, nearbyLocations = []
}: LocationSectionProps) {
  const [activeTab, setActiveTab] = useState<'map' | 'nearby'>('map');
  const [autoPlaces, setAutoPlaces] = useState<NearbyPlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const response = await fetch(`/api/nearby?lat=${lat}&lng=${lng}&radius=3000`);
        const data = await response.json();
        setAutoPlaces(data.places || []);
      } catch (e) {
        console.error("Failed to fetch nearby places", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlaces();
  }, [lat, lng]);

  // Group manual locations by category
  const grouped = nearbyLocations.reduce((acc, loc) => {
    if (!acc[loc.category]) acc[loc.category] = [];
    acc[loc.category].push(loc);
    return acc;
  }, {} as Record<string, ManualNearbyLocation[]>);

  return (
    <section className="space-y-4">
      <p className="text-sm text-[var(--text-muted)]">
        {location}, {city}
      </p>

      {/* Sub-tabs */}
      <div className="flex gap-0 border border-[var(--border)] rounded-[var(--radius-sm)] overflow-hidden w-fit">
        {(['map', 'nearby'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
              activeTab === tab
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-white'
            }`}
          >
            {tab === 'map' ? <><MapPin className="w-3 h-3" /> Map</> : <><Navigation className="w-3 h-3" /> Nearby</>}
          </button>
        ))}
      </div>

      {/* Map tab */}
      {activeTab === 'map' && (
        <MapView lat={lat} lng={lng} projectName={projectName} priceLabel={priceLabel} />
      )}

      {/* Nearby tab */}
      {activeTab === 'nearby' && (
        <div className="space-y-6">
          {/* Manual admin-entered locations */}
          {nearbyLocations.length > 0 && (
            <div className="space-y-4">
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat}>
                  <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">
                    {CATEGORY_LABELS[cat as ManualNearbyLocation['category']]}
                  </p>
                  <div className="space-y-1.5">
                    {items.map(loc => (
                      <div key={loc.id}
                        className="flex items-center justify-between py-2 px-3 bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-xs)]">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{CATEGORY_ICONS[loc.category]}</span>
                          <span className="text-sm font-medium text-[var(--text-primary)]">{loc.name}</span>
                        </div>
                        <span className="text-xs font-bold text-[var(--primary)] bg-[var(--primary-light)] px-2 py-0.5 rounded-full">
                          {loc.distance}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Auto-fetched Overpass places */}
          {nearbyLocations.length > 0 && autoPlaces.length > 0 && (
            <div className="border-t border-[var(--border)] pt-4">
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">
                More Nearby (Auto-detected)
              </p>
            </div>
          )}
          <NearbyPlacesList places={autoPlaces} isLoading={isLoading} />
        </div>
      )}
    </section>
  );
}
```

---

## TASK 4 — Update `app/projects/[slug]/page.tsx`

Make the following targeted changes to the existing file. **Do not rewrite the whole file — apply only these changes:**

### 4a — Update the TABS array (remove pros-cons tab, remove video tab implicitly)

Replace:
```ts
const TABS = [
  { id: 'overview',     label: 'Overview' },
  { id: 'pros-cons',    label: 'Pros & Cons' },
  { id: 'amenities',    label: 'Amenities' },
  { id: 'floor-plans',  label: 'Floor Plans' },
  { id: 'pricing',      label: 'Pricing' },
  { id: 'payment',      label: 'Payment' },
  { id: 'location',     label: 'Location' },
  { id: 'legal',        label: 'Legal' },
  { id: 'builder',      label: 'Builder' },
];
```

With:
```ts
const TABS = [
  { id: 'overview',     label: 'Overview' },
  { id: 'amenities',    label: 'Amenities' },
  { id: 'floor-plans',  label: 'Floor Plans' },
  { id: 'pricing',      label: 'Pricing' },
  { id: 'payment',      label: 'Payment' },
  { id: 'location',     label: 'Location' },
  { id: 'legal',        label: 'Legal' },
  { id: 'builder',      label: 'Builder' },
];
```

### 4b — Add EMI state near the top of the component

After the `const [activeVideo, setActiveVideo] = useState(0);` line, add:

```ts
const [expandedEMIRow, setExpandedEMIRow] = useState<string | null>(null);
const [emiRate, setEmiRate] = useState(8.5);
const [emiTenure, setEmiTenure] = useState(20);
```

### 4c — Add inline EMI calculator helper function

Add this helper function BEFORE the `return (` statement (after all state declarations):

```ts
function calcEMI(principal: number, rate: number, tenureYears: number): number {
  if (!principal || !rate || !tenureYears) return 0;
  const r = rate / 12 / 100;
  const n = tenureYears * 12;
  return Math.round((principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
}
```

### 4d — Update the LocationSection JSX call

Find the `<LocationSection` usage in the JSX and update it to pass `nearbyLocations`:

```tsx
<LocationSection
  lat={project.lat}
  lng={project.lng}
  projectName={project.name}
  priceLabel={formatINR(minPrice)}
  location={project.location}
  city={project.city}
  nearbyLocations={project.nearbyLocations}
/>
```

### 4e — Delete the entire Videos section block

Find and remove this entire block (from comment to closing div):

```tsx
{/* ── VIDEOS ───────────────────────────────── */}
{project.videos && project.videos.length > 0 && (
  <div className="py-10 border-b border-[var(--border)]">
    ...entire block...
  </div>
)}
```

### 4f — Delete the entire Pros & Cons section block

Find and remove this entire block:

```tsx
{/* ── PROS & CONS ──────────────────────────── */}
<div id="section-pros-cons" className="scroll-mt-36 py-10 border-b border-[var(--border)]">
  ...entire block...
</div>
```

### 4g — Replace the Pricing section with tabbed + inline EMI version

Find the entire `{/* ── PRICING ──────────────────────────────── */}` block and replace it with:

```tsx
{/* ── PRICING ──────────────────────────────── */}
<div id="section-pricing" className="scroll-mt-36 py-10 border-b border-[var(--border)]">
  <h2 className="text-lg font-black text-[var(--text-primary)] mb-6"
    style={{ fontFamily: 'var(--font-display)' }}>
    Pricing & Unit Plans
  </h2>

  {/* BHK type tab switcher */}
  {(() => {
    // Group unit configs by base BHK type
    const typeGroups = Array.from(
      project.unitConfigs.reduce((map, unit) => {
        const base = unit.type.match(/^(\d+(?:\.\d+)?(?:\s*BHK|RK)?)/i)?.[0]?.trim() || unit.type.split(/[-–(]/)[0].trim();
        if (!map.has(base)) map.set(base, []);
        map.get(base)!.push(unit);
        return map;
      }, new Map<string, typeof project.unitConfigs>())
    );
    const [activePricingType, setActivePricingType] = React.useState(typeGroups[0]?.[0] || '');
    const activeUnits = typeGroups.find(([key]) => key === activePricingType)?.[1] || typeGroups[0]?.[1] || [];

    return (
      <div className="space-y-4">
        {/* Type tabs */}
        {typeGroups.length > 1 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {typeGroups.map(([base]) => (
              <button
                key={base}
                onClick={() => setActivePricingType(base)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                  activePricingType === base
                    ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                    : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]'
                }`}
              >
                {base}
              </button>
            ))}
          </div>
        )}

        {/* Pricing table */}
        <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--surface-raised)] border-b border-[var(--border)]">
                <th className="px-4 py-3 text-left font-black text-[var(--text-muted)] text-[10px] uppercase tracking-wider">Carpet Area</th>
                <th className="px-4 py-3 text-left font-black text-[var(--text-muted)] text-[10px] uppercase tracking-wider">All Inc. Price</th>
                <th className="px-4 py-3 text-left font-black text-[var(--text-muted)] text-[10px] uppercase tracking-wider">Min Downpayment</th>
                <th className="px-4 py-3 text-left font-black text-[var(--text-muted)] text-[10px] uppercase tracking-wider">EMI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {activeUnits.map(unit => {
                const downpayment = unit.priceMin * 0.15;
                const loanAmount = unit.priceMin - downpayment;
                const emi = calcEMI(loanAmount, emiRate, emiTenure);
                const isExpanded = expandedEMIRow === unit.id;

                return (
                  <React.Fragment key={unit.id}>
                    <tr className="hover:bg-[var(--surface-raised)]/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-[var(--text-primary)]">{unit.area} sqft</td>
                      <td className="px-4 py-3 font-bold text-[var(--primary)]">
                        {formatINR(unit.priceMin)}
                        {unit.priceMax > unit.priceMin && ` – ${formatINR(unit.priceMax)}`}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {formatINR(Math.round(downpayment))}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setExpandedEMIRow(isExpanded ? null : unit.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                            isExpanded
                              ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                              : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
                          }`}
                        >
                          {formatINR(emi)}/mo
                          <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                      </td>
                    </tr>
                    {/* Inline EMI calculator */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={4} className="px-4 pb-4 bg-[var(--surface-raised)]/50">
                          <div className="p-4 bg-white border border-[var(--border)] rounded-[var(--radius-sm)] space-y-3 mt-1">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">EMI Calculator</p>
                              <p className="text-lg font-black text-[var(--primary)]">
                                {formatINR(calcEMI(unit.priceMin * 0.85, emiRate, emiTenure))}/mo
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-[var(--text-muted)] uppercase font-bold">
                                  <span>Interest Rate</span><span>{emiRate}%</span>
                                </div>
                                <input type="range" min={6.5} max={14} step={0.25}
                                  value={emiRate}
                                  onChange={e => setEmiRate(Number(e.target.value))}
                                  className="w-full h-1.5 accent-[var(--primary)] cursor-pointer rounded-full" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-[var(--text-muted)] uppercase font-bold">
                                  <span>Tenure</span><span>{emiTenure} yrs</span>
                                </div>
                                <input type="range" min={5} max={30} step={1}
                                  value={emiTenure}
                                  onChange={e => setEmiTenure(Number(e.target.value))}
                                  className="w-full h-1.5 accent-[var(--primary)] cursor-pointer rounded-full" />
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 pt-1">
                              {[
                                { label: 'Loan Amount', value: formatINR(Math.round(unit.priceMin * 0.85)) },
                                { label: 'Down Payment', value: formatINR(Math.round(unit.priceMin * 0.15)) },
                                { label: 'Total Interest', value: formatINR(calcEMI(unit.priceMin * 0.85, emiRate, emiTenure) * emiTenure * 12 - Math.round(unit.priceMin * 0.85)) },
                              ].map(item => (
                                <div key={item.label} className="bg-[var(--surface-raised)] p-2 rounded-[var(--radius-xs)]">
                                  <p className="text-[9px] text-[var(--text-muted)] uppercase font-bold">{item.label}</p>
                                  <p className="text-xs font-bold text-[var(--text-primary)]">{item.value}</p>
                                </div>
                              ))}
                            </div>
                            <p className="text-[9px] text-[var(--text-muted)] italic">* Estimate only. 85% loan assumed. Actual terms may vary.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  })()}
</div>
```

**Important:** Add `import React, { useEffect, useState, useRef } from "react";` at the top (replace the existing react import). The inline component uses `React.useState` to avoid hook ordering issues.

---

## TASK 5 — Create `components/admin/AmenityLibraryManager.tsx` (new file)

This component allows the admin to manage a global list of amenities. Each amenity has a name, emoji icon, and category. Amenities added here are reusable across all projects.

```tsx
'use client';

import { useState, useEffect } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { AmenityLibraryItem } from "@/types/project";
import { toast } from "sonner";

const CATEGORY_OPTIONS = [
  { value: 'internal', label: 'Internal' },
  { value: 'external', label: 'External' },
  { value: 'both', label: 'Both' },
];

const COMMON_EMOJIS = ['💪', '🏊', '🏠', '🛡️', '⚡', '🚗', '🌳', '👶', '🏏', '⛳', '🎾', '🧘', '🚴', '🎭', '🛁', '🔒', '📹', '🌊', '🎪', '🏋️', '🧒', '🛹', '🏑', '🎡'];

interface AmenityLibraryManagerProps {
  selectedInternal: string[];
  selectedExternal: string[];
  onChangeInternal: (items: string[]) => void;
  onChangeExternal: (items: string[]) => void;
}

export default function AmenityLibraryManager({
  selectedInternal, selectedExternal, onChangeInternal, onChangeExternal
}: AmenityLibraryManagerProps) {
  const [library, setLibrary] = useState<AmenityLibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('✨');
  const [newCategory, setNewCategory] = useState<'internal' | 'external' | 'both'>('external');
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'internal' | 'external'>('internal');

  const fetchLibrary = async () => {
    try {
      const res = await fetch('/api/admin/amenity-library', { credentials: 'include' });
      const data = await res.json();
      setLibrary(data.amenities || []);
    } catch {
      // Fallback to empty
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLibrary(); }, []);

  const addToLibrary = async () => {
    if (!newName.trim()) return;
    setIsAdding(true);
    try {
      const res = await fetch('/api/admin/amenity-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName.trim(), icon: newIcon, category: newCategory }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLibrary(prev => [...prev, data.amenity]);
      setNewName('');
      toast.success('Amenity added to library');
    } catch {
      toast.error('Failed to add amenity');
    } finally {
      setIsAdding(false);
    }
  };

  const removeFromLibrary = async (id: string) => {
    try {
      await fetch(`/api/admin/amenity-library/${id}`, { method: 'DELETE', credentials: 'include' });
      setLibrary(prev => prev.filter(a => a.id !== id));
      // Also remove from project selections
      onChangeInternal(selectedInternal.filter(n => {
        const item = library.find(a => a.id === id);
        return n !== item?.name;
      }));
      onChangeExternal(selectedExternal.filter(n => {
        const item = library.find(a => a.id === id);
        return n !== item?.name;
      }));
    } catch {
      toast.error('Failed to remove');
    }
  };

  const toggleSelect = (amenity: AmenityLibraryItem, forInternal: boolean) => {
    if (forInternal) {
      const next = selectedInternal.includes(amenity.name)
        ? selectedInternal.filter(n => n !== amenity.name)
        : [...selectedInternal, amenity.name];
      onChangeInternal(next);
    } else {
      const next = selectedExternal.includes(amenity.name)
        ? selectedExternal.filter(n => n !== amenity.name)
        : [...selectedExternal, amenity.name];
      onChangeExternal(next);
    }
  };

  const filteredLibrary = library.filter(a =>
    a.category === activeTab || a.category === 'both'
  );
  const activeSelected = activeTab === 'internal' ? selectedInternal : selectedExternal;

  return (
    <div className="space-y-5">
      {/* Tab switcher */}
      <div className="flex gap-0 border border-[var(--border)] rounded-[var(--radius-xs)] overflow-hidden w-fit">
        {(['internal', 'external'] as const).map(tab => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === tab ? 'bg-[var(--primary)] text-white' : 'bg-white text-[var(--text-muted)]'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Amenity grid from library */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading library…
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {filteredLibrary.map(amenity => {
            const selected = activeSelected.includes(amenity.name);
            return (
              <div key={amenity.id}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-xs)] border cursor-pointer transition-all ${
                  selected
                    ? 'bg-[var(--primary-light)] border-[var(--primary)] text-[var(--primary)]'
                    : 'bg-[var(--surface-raised)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]/50'
                }`}
                onClick={() => toggleSelect(amenity, activeTab === 'internal')}>
                <span className="text-lg flex-shrink-0">{amenity.icon}</span>
                <span className="text-xs font-medium flex-1 truncate">{amenity.name}</span>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); removeFromLibrary(amenity.id); }}
                  className="text-[var(--text-muted)] hover:text-[var(--danger)] opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add new amenity to library */}
      <div className="pt-4 border-t border-[var(--border)] space-y-3">
        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">Add to Global Library</p>
        <div className="flex flex-wrap gap-2">
          {COMMON_EMOJIS.map(e => (
            <button key={e} type="button" onClick={() => setNewIcon(e)}
              className={`w-8 h-8 text-lg rounded-lg flex items-center justify-center transition-all ${
                newIcon === e ? 'bg-[var(--primary-light)] ring-2 ring-[var(--primary)]' : 'bg-[var(--surface-raised)] hover:bg-[var(--border)]'
              }`}>
              {e}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text" value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addToLibrary()}
            placeholder="Amenity name, e.g. Swimming Pool"
            className="flex-1 bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-xs)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]"
          />
          <select value={newCategory}
            onChange={e => setNewCategory(e.target.value as any)}
            className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-xs)] px-3 py-2 text-xs">
            {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button type="button" onClick={addToLibrary} disabled={isAdding || !newName.trim()}
            className="flex items-center gap-1.5 px-3 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-[var(--radius-xs)] hover:opacity-90 disabled:opacity-50">
            {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Add
          </button>
        </div>
      </div>

      {/* Selected summary */}
      {(selectedInternal.length > 0 || selectedExternal.length > 0) && (
        <div className="text-xs text-[var(--text-muted)] pt-1">
          Selected: {selectedInternal.length} internal · {selectedExternal.length} external
        </div>
      )}
    </div>
  );
}
```

---

## TASK 6 — Create `components/admin/NearbyLocationsForm.tsx` (new file)

```tsx
'use client';

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { ManualNearbyLocation } from "@/types/project";

const CATEGORIES = [
  { value: 'school', label: '🏫 School' },
  { value: 'hospital', label: '🏥 Hospital' },
  { value: 'mall', label: '🛍️ Mall' },
  { value: 'metro', label: '🚇 Metro / Transit' },
  { value: 'it_park', label: '💼 IT Park' },
  { value: 'park', label: '🌳 Park' },
  { value: 'restaurant', label: '🍽️ Restaurant' },
  { value: 'bank', label: '🏦 Bank' },
  { value: 'pharmacy', label: '💊 Pharmacy' },
  { value: 'other', label: '📍 Other' },
];

interface NearbyLocationsFormProps {
  value: ManualNearbyLocation[];
  onChange: (locs: ManualNearbyLocation[]) => void;
}

export default function NearbyLocationsForm({ value, onChange }: NearbyLocationsFormProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ManualNearbyLocation['category']>('school');
  const [distance, setDistance] = useState('');

  const add = () => {
    if (!name.trim() || !distance.trim()) return;
    onChange([...value, {
      id: crypto.randomUUID(),
      name: name.trim(),
      category,
      distance: distance.trim(),
    }]);
    setName(''); setDistance('');
  };

  const remove = (id: string) => onChange(value.filter(l => l.id !== id));

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">
        Nearby Locations
      </h3>
      <p className="text-xs text-[var(--text-muted)]">
        Manually add key landmarks shown on the property page. These are saved to this project only.
      </p>

      {/* Existing entries */}
      <div className="space-y-2">
        {value.map(loc => {
          const cat = CATEGORIES.find(c => c.value === loc.category);
          return (
            <div key={loc.id}
              className="flex items-center justify-between p-2.5 bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-xs)]">
              <div className="flex items-center gap-2">
                <span className="text-base">{cat?.label.split(' ')[0]}</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">{loc.name}</span>
                <span className="text-xs text-[var(--text-muted)]">·</span>
                <span className="text-xs font-bold text-[var(--primary)]">{loc.distance}</span>
              </div>
              <button type="button" onClick={() => remove(loc.id)}
                className="text-[var(--text-muted)] hover:text-[var(--danger)] p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add new */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Name, e.g. Holy Angels School"
          className="sm:col-span-2 bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-xs)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]" />
        <select value={category} onChange={e => setCategory(e.target.value as any)}
          className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-xs)] px-3 py-2 text-xs focus:outline-none focus:border-[var(--primary)]">
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <div className="flex gap-2">
          <input type="text" value={distance} onChange={e => setDistance(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="e.g. 700m"
            className="flex-1 bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-xs)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]" />
          <button type="button" onClick={add} disabled={!name.trim() || !distance.trim()}
            className="px-3 py-2 bg-[var(--primary)] text-white rounded-[var(--radius-xs)] hover:opacity-90 disabled:opacity-40">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## TASK 7 — Update `components/admin/ProjectForm.tsx`

### 7a — Add imports at the top

Add these two imports:
```ts
import AmenityLibraryManager from "./AmenityLibraryManager";
import NearbyLocationsForm from "./NearbyLocationsForm";
import { ManualNearbyLocation } from "@/types/project";
```

### 7b — Add new state fields inside the component

After the existing `project` state declaration, add:
```ts
// These mirror internalAmenities and externalAmenities from project state
// We manage them separately so the form is clear
```

And update the default project state to include these fields:
```ts
internalAmenities: [],
externalAmenities: [],
nearbyLocations: [],
```

### 7c — Remove the Pros & Cons section

Delete the entire `{/* Pros & Cons */}` grid section from the JSX.

### 7d — Add Amenities section in its place

Where the Pros & Cons block was, add:
```tsx
{/* Amenities */}
<div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] space-y-4">
  <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">Amenities</h3>
  <AmenityLibraryManager
    selectedInternal={project.internalAmenities || []}
    selectedExternal={project.externalAmenities || []}
    onChangeInternal={(items) => setProject({ ...project, internalAmenities: items })}
    onChangeExternal={(items) => setProject({ ...project, externalAmenities: items })}
  />
</div>
```

### 7e — Add Nearby Locations section

After the Amenities section, add:
```tsx
{/* Nearby Locations */}
<div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)]">
  <NearbyLocationsForm
    value={(project.nearbyLocations as ManualNearbyLocation[]) || []}
    onChange={(locs) => setProject({ ...project, nearbyLocations: locs })}
  />
</div>
```

### 7f — Update the submit body to include new fields

In `handleSubmit`, ensure the body includes `nearby_locations` and `internal_amenities` / `external_amenities`:
```ts
const body = {
  ...project,
  builder_id: selectedBuilderId || null,
  nearby_locations: project.nearbyLocations || [],
  internal_amenities: project.internalAmenities || [],
  external_amenities: project.externalAmenities || [],
};
```

---

## TASK 8 — Create API route `app/api/admin/amenity-library/route.ts` (new file)

```ts
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createAdminSupabaseClient } from '@/lib/supabase-server';

const unauth = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

export async function GET(req: NextRequest) {
  if (!await isAdminAuthenticated(req)) return unauth();
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('amenity_library')
    .select('*')
    .order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const amenities = (data || []).map((row: any) => ({
    id: row.id, name: row.name, icon: row.icon, category: row.category,
  }));
  return NextResponse.json({ amenities });
}

export async function POST(req: NextRequest) {
  if (!await isAdminAuthenticated(req)) return unauth();
  const body = await req.json();
  const { name, icon, category } = body;
  if (!name || !icon || !category) {
    return NextResponse.json({ error: 'name, icon, category required' }, { status: 400 });
  }
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('amenity_library')
    .insert({ name, icon, category })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ amenity: { id: data.id, name: data.name, icon: data.icon, category: data.category } });
}
```

---

## TASK 9 — Create API route `app/api/admin/amenity-library/[id]/route.ts` (new file)

```ts
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createAdminSupabaseClient } from '@/lib/supabase-server';

const unauth = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await isAdminAuthenticated(req)) return unauth();
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from('amenity_library').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
```

---

## TASK 10 — Update `app/api/admin/projects/route.ts`

In the `projectSchema` zod object, add these optional fields:
```ts
nearby_locations: z.array(z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  distance: z.string(),
})).optional().default([]),
internal_amenities: z.array(z.string()).optional().default([]),
external_amenities: z.array(z.string()).optional().default([]),
```

And in the `upsert`/`insert` call (wherever the project row is built), pass these:
```ts
nearby_locations: validatedData.nearby_locations,
internal_amenities: validatedData.internal_amenities,
external_amenities: validatedData.external_amenities,
```

---

## TASK 11 — Supabase migration SQL

Create a file `supabase/migrations/20260528_amenity_library_nearby.sql`:

```sql
-- Global amenity library (reused across all projects)
CREATE TABLE IF NOT EXISTS amenity_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '✨',
  category TEXT NOT NULL DEFAULT 'both' CHECK (category IN ('internal', 'external', 'both')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add nearby_locations column to projects table
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS nearby_locations JSONB DEFAULT '[]'::jsonb;

-- Add internal/external amenities columns (already exist but ensure they do)
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS internal_amenities TEXT[] DEFAULT '{}';

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS external_amenities TEXT[] DEFAULT '{}';

-- RLS: only admin service role can modify amenity_library
ALTER TABLE amenity_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access" ON amenity_library
  USING (true) WITH CHECK (true);
```

Run this in your Supabase SQL editor or via `supabase db push`.

---

## Summary of what changes and what doesn't

| What changes | File |
|---|---|
| Types updated with `ManualNearbyLocation`, `AmenityLibraryItem`, `nearbyLocations` field | `types/project.ts` |
| Service maps `nearby_locations` from DB row | `services/projects.ts` |
| Location section now has Map/Nearby tabs, no 3D view | `components/map/LocationSection.tsx` |
| Project detail: no Video section, no Pros & Cons section | `app/projects/[slug]/page.tsx` |
| Project detail: Pricing has BHK type tabs + inline collapsible EMI per row | `app/projects/[slug]/page.tsx` |
| Admin form: amenities use global library (pick once, reuse) | `components/admin/ProjectForm.tsx` |
| Admin form: nearby locations manager added | `components/admin/ProjectForm.tsx` |
| Admin form: Pros & Cons removed | `components/admin/ProjectForm.tsx` |
| New global amenity library component | `components/admin/AmenityLibraryManager.tsx` |
| New nearby locations form component | `components/admin/NearbyLocationsForm.tsx` |
| New API routes for amenity library CRUD | `app/api/admin/amenity-library/` |
| DB migration for new columns | `supabase/migrations/` |

**What does NOT change:**
- Gallery, Builder section, Legal section, Payment section, Floor Plans section
- All API routes except projects (minor schema addition)
- All explore/compare/onboarding pages
- All other components not listed above
- Auth, storage, AI modal, lead qualification