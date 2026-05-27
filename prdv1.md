# Propcinity UI Fixes — Implementation Prompt

> Paste this into Claude Code or your AI coding assistant. All file paths, old code, and exact replacements are included.

---

## Overview of Changes

| # | File | Change |
|---|------|--------|
| 1 | `app/icon.tsx` | Favicon: white bg, "P" orange, "C" black, Syne Extra Bold |
| 2 | `app/dashboard/page.tsx` | Replace risk badge + remove button with round X at top-right + % matched at top-left |
| 3 | `app/explore/page.tsx` | Replace action overlay with round + button at top-right + % matched at top-left |
| 4 | `app/profile/page.tsx` | Replace initials box with a proper human User icon |

---

## Task 1 — Favicon (`app/icon.tsx`)

**Goal:** White background, "P" in orange `#FF4500`, "C" in black `#0D0D0D`, Syne Extra Bold font styling (weight 900).

### Replace entire file:

**Old `app/icon.tsx`:**
```tsx
import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#FF4500',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 900,
          fontSize: 20,
          fontFamily: 'sans-serif',
        }}
      >
        P
      </div>
    ),
    { ...size }
  )
}
```

**New `app/icon.tsx`:**
```tsx
import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#FFFFFF',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 900,
          fontSize: 16,
          fontFamily: 'sans-serif',
          letterSpacing: '-1px',
          border: '1.5px solid #E5E5E5',
        }}
      >
        <span style={{ color: '#FF4500' }}>P</span>
        <span style={{ color: '#0D0D0D' }}>C</span>
      </div>
    ),
    { ...size }
  )
}
```

> **Note:** Also update `app/apple-icon.tsx` with the same logic if it exists and follows the same pattern.

---

## Task 2 — Dashboard Page (`app/dashboard/page.tsx`)

**Goal:**
- Remove the old risk badge / hover-to-remove pill overlay at top-left
- Add a **round X button** at the **top-right corner** of each card with hover tooltip "Remove from dashboard"
- Add a **% matched badge** at the **top-left corner** based on user intent scoring
- The X button has a red hover effect; badge shows e.g. `87% Match`

### Step 2a — Add the `scoreByIntent` helper

Add this function **before the `DashboardPage` component** (after imports):

```tsx
// Score a project against user intent — returns 0-100
function getMatchPercent(project: Project, intent: any): number {
  if (!intent) return 0;
  let score = 0;
  const MAX = 90;

  // Sub-location match
  if (intent.subLocations?.length > 0) {
    const pLoc = (project.location || '').toLowerCase();
    const match = intent.subLocations.some((sl: string) => {
      const s = sl.toLowerCase();
      return pLoc.includes(s) || s.includes(pLoc);
    });
    score += match ? 30 : 5;
  } else {
    score += 15;
  }

  // Property type match
  if (intent.propertyType?.length > 0) {
    const types = (project.unitConfigs || []).map((u: any) => (u.type || '').toLowerCase());
    const match = intent.propertyType.some((sel: string) => {
      const s = sel.toLowerCase();
      if (s === 'apartment') return types.some((t: string) => /^\d/.test(t) || t.includes('bhk'));
      if (s === 'villa') return types.some((t: string) => t.includes('villa') || t.includes('row house'));
      if (s === 'plot') return types.some((t: string) => t.includes('plot'));
      return false;
    });
    score += match ? 20 : 3;
  } else {
    score += 10;
  }

  // BHK match
  if (intent.bhkType?.length > 0) {
    const types = (project.unitConfigs || []).map((u: any) => (u.type || '').toLowerCase());
    const match = intent.bhkType.some((bhk: string) => {
      const b = bhk.toLowerCase();
      return types.some((t: string) => t === b || t.includes(b));
    });
    score += match ? 20 : 3;
  } else {
    score += 10;
  }

  // Budget match
  if (intent.budget?.min > 0 || intent.budget?.max > 0) {
    const uMin = intent.budget.min || 0;
    const uMax = intent.budget.isOpenMax ? Infinity : (intent.budget.max || Infinity);
    const prices = (project.unitConfigs || []).map((u: any) => u.priceMin).filter(Boolean);
    if (prices.length > 0) {
      const pMin = Math.min(...prices);
      const pMax = Math.max(...(project.unitConfigs || []).map((u: any) => u.priceMax || u.priceMin).filter(Boolean));
      score += (pMin <= uMax && pMax >= uMin) ? 20 : 2;
    }
  } else {
    score += 10;
  }

  return Math.min(100, Math.round((score / MAX) * 100));
}
```

### Step 2b — Replace the card overlay block

**Find this block** inside the `displayResults.map(...)` section of `DashboardPage`:

```tsx
{/* Risk pill (normal) → Remove pill (hover) — same size */}
<div className="absolute top-3 left-3 z-30" style={{ height: '22px' }}>
  <span className={`
    absolute inset-0 inline-flex items-center justify-center
    px-2.5 text-[10px] font-bold rounded-full whitespace-nowrap
    transition-all duration-150
    group-hover:opacity-0 group-hover:pointer-events-none
  `} style={{
    background: (project as any).riskLabel === 'low'
      ? 'var(--success-light)' : (project as any).riskLabel === 'medium'
      ? 'var(--warning-light)' : 'var(--danger-light)',
    color: (project as any).riskLabel === 'low'
      ? 'var(--success)' : (project as any).riskLabel === 'medium'
      ? 'var(--warning)' : 'var(--danger)',
  }}>
    {(project as any).riskLabel === 'low' ? 'Low Risk'
      : (project as any).riskLabel === 'medium' ? 'Med Risk' : 'High Risk'}
  </span>
  <button
    onClick={() => handleRemove(project.id)}
    className="absolute inset-0 inline-flex items-center justify-center gap-1
      px-2.5 text-[10px] font-bold rounded-full whitespace-nowrap
      bg-[var(--danger)] text-white
      opacity-0 pointer-events-none
      group-hover:opacity-100 group-hover:pointer-events-auto
      transition-all duration-150 hover:brightness-90"
  >
    <X className="w-3 h-3" /> Remove
  </button>
</div>
```

**Replace with:**

```tsx
{/* % Matched badge — top-left */}
{userIntent && (() => {
  const pct = getMatchPercent(project, userIntent);
  return (
    <div className="absolute top-3 left-3 z-30 pointer-events-none">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black whitespace-nowrap shadow-sm"
        style={{
          background: pct >= 75 ? '#DCFCE7' : pct >= 50 ? '#FEF9C3' : '#FEE2E2',
          color: pct >= 75 ? '#16A34A' : pct >= 50 ? '#CA8A04' : '#DC2626',
        }}>
        <Sparkles className="w-2.5 h-2.5" />
        {pct}% Match
      </span>
    </div>
  );
})()}

{/* Round X remove button — top-right */}
<button
  onClick={() => handleRemove(project.id)}
  title="Remove from dashboard"
  className="absolute top-3 right-3 z-30 w-7 h-7 rounded-full
    bg-black/30 text-white backdrop-blur-sm
    flex items-center justify-center
    opacity-0 group-hover:opacity-100
    hover:bg-[var(--danger)] hover:scale-110
    transition-all duration-150 shadow-sm"
>
  <X className="w-3.5 h-3.5" />
</button>
```

---

## Task 3 — Explorer Page (`app/explore/page.tsx`)

**Goal:**
- Replace the existing action overlay (currently positioned at `top-12 left-3`) with:
  - **Round + button** at **top-right corner** — "Add to Dashboard" (shows ✓ if already added)
  - **% matched badge** at **top-left corner**
- The + button shows green on hover; ✓ (already added) shows as solid primary color
- Hover tooltip: `"Add to Dashboard"` or `"Remove from Dashboard"`

### Step 3a — Find and replace the grid card overlay

**Find this block** inside the `viewMode === 'grid'` section:

```tsx
<ProjectCard project={project} index={index} />
{/* Action overlay */}
<div className="absolute top-12 left-3 flex flex-col gap-1.5 z-10
  opacity-0 group-hover:opacity-100 transition-opacity">
  <button onClick={e => toggleCurated(project.id, e)}
    title={curatedIds.includes(project.id) ? 'Remove from Dashboard' : 'Add to Dashboard'}
    className={`p-2 rounded-full shadow-md transition-all backdrop-blur-sm ${
      curatedIds.includes(project.id)
        ? 'bg-[var(--primary)] text-white'
        : 'bg-white/90 text-[var(--text-muted)] hover:text-[var(--primary)]'
    }`}>
    <LayoutDashboard className="w-3.5 h-3.5" />
  </button>
  <button onClick={e => toggleSaved(project.id, e)}
    title={savedIds.includes(project.id) ? 'Unsave' : 'Save'}
    className={`p-2 rounded-full shadow-md transition-all backdrop-blur-sm ${
      savedIds.includes(project.id)
        ? 'bg-[var(--danger)] text-white'
        : 'bg-white/90 text-[var(--text-muted)] hover:text-[var(--danger)]'
    }`}>
    <Star className="w-3.5 h-3.5" />
  </button>
</div>
```

**Replace with:**

```tsx
<ProjectCard project={project} index={index} />

{/* % Matched badge — top-left */}
{userIntent && (() => {
  const pct = scoreByIntent(project, userIntent);
  const pctDisplay = Math.min(100, Math.round((pct / 90) * 100));
  if (pct < 0) return null;
  return (
    <div className="absolute top-3 left-3 z-30 pointer-events-none">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black whitespace-nowrap shadow-sm"
        style={{
          background: pctDisplay >= 75 ? '#DCFCE7' : pctDisplay >= 50 ? '#FEF9C3' : '#FEE2E2',
          color: pctDisplay >= 75 ? '#16A34A' : pctDisplay >= 50 ? '#CA8A04' : '#DC2626',
        }}>
        <Sparkles className="w-2.5 h-2.5" />
        {pctDisplay}% Match
      </span>
    </div>
  );
})()}

{/* Round + / ✓ button — top-right */}
<button
  onClick={e => toggleCurated(project.id, e)}
  title={curatedIds.includes(project.id) ? 'Remove from Dashboard' : 'Add to Dashboard'}
  className={`absolute top-3 right-3 z-30 w-7 h-7 rounded-full
    flex items-center justify-center
    opacity-0 group-hover:opacity-100
    transition-all duration-150 shadow-sm backdrop-blur-sm
    hover:scale-110 ${
      curatedIds.includes(project.id)
        ? 'bg-[var(--primary)] text-white'
        : 'bg-black/30 text-white hover:bg-[var(--primary)]'
    }`}
>
  {curatedIds.includes(project.id)
    ? <Check className="w-3.5 h-3.5" />
    : <Plus className="w-3.5 h-3.5" />
  }
</button>
```

> **Note:** `Sparkles`, `Check`, and `Plus` must be imported. `Sparkles` is already imported. Add `Check` and `Plus` to the import from `'lucide-react'` if not already present:
> ```tsx
> import {
>   Search, SlidersHorizontal, X, LayoutGrid, List,
>   Building2, MapPin, Star, LayoutDashboard,
>   ChevronDown, TrendingUp, ShieldCheck, Check,
>   ArrowUpDown, Sparkles, Plus  // ← ensure Plus and Check are here
> } from 'lucide-react';
> ```

---

## Task 4 — Profile Page (`app/profile/page.tsx`)

**Goal:** Replace the gradient initials square with a clean round white circle containing a `User` icon in the primary orange color. Matches the fintech/clean aesthetic.

### Find this block in `ProfilePage`:

```tsx
<motion.div
  initial={{ scale: 0.8, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  className="w-24 h-24 bg-gradient-to-br from-[var(--primary)] to-orange-400 
    rounded-[2.5rem] flex items-center justify-center text-white text-3xl font-black
    shadow-[0_20px_40px_rgba(255,107,0,0.2)] mb-6">
  {intent?.name ? intent.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : <User className="w-10 h-10" />}
</motion.div>
```

**Replace with:**

```tsx
<motion.div
  initial={{ scale: 0.8, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  className="w-24 h-24 bg-[var(--primary-light)] border-2 border-[var(--primary)]
    rounded-full flex items-center justify-center
    shadow-[0_8px_32px_rgba(255,69,0,0.15)] mb-6">
  <User className="w-10 h-10 text-[var(--primary)]" strokeWidth={1.5} />
</motion.div>
```

---

## Summary Checklist

- [ ] `app/icon.tsx` — White bg, P orange, C black, border, Syne-weight styling
- [ ] `app/dashboard/page.tsx` — Add `getMatchPercent()` helper + swap overlay to % badge (top-left) + round X (top-right)
- [ ] `app/explore/page.tsx` — Swap grid overlay to % badge (top-left) + round + button (top-right), ensure `Plus` and `Check` are imported
- [ ] `app/profile/page.tsx` — Replace gradient initials with clean round User icon

---

## Color Reference (from `globals.css`)

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#FF4500` | Orange — CTAs, active states |
| `--primary-light` | `#FFF1EC` | Orange tint backgrounds |
| `--danger` | `#DC2626` | Remove / destructive actions |
| `--danger-light` | `#FEF2F2` | Danger backgrounds |
| Match ≥75% | `#DCFCE7` / `#16A34A` | Green badge |
| Match 50–74% | `#FEF9C3` / `#CA8A04` | Yellow badge |
| Match <50% | `#FEE2E2` / `#DC2626` | Red badge |