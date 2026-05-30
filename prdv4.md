# Propcinity — Bug Fixes & Feature Updates

> **Cursor / Claude Code Prompt (paste this at the top of every session):**
> "You are working on the Propcinity Next.js project. Apply each fix described in PROPCINITY_FIXES.md one task at a time. Do NOT break existing functionality. After each file change, confirm what changed and why. Use TypeScript. Do not add new dependencies unless explicitly required."

---

## Overview of all changes

| # | Area | Type | File(s) |
|---|------|------|---------|
| 1 | Explorer → Dashboard sync | Bug fix | `app/explore/page.tsx` + `app/dashboard/page.tsx` |
| 2 | Profile icon → skeleton silhouette | UI update | `components/layout/TopHeader.tsx` |
| 3 | Project card bullet points stacked vertically | UI fix | `components/property/InsightsPanel.tsx` |
| 4 | Save → Add to Dashboard button on project page | Feature | `app/projects/[slug]/page.tsx` |
| 5 | Map — remove blue box, better tiles, Open in Maps button | UI fix | `components/map/ProjectMarker.tsx` + `components/map/LocationSection.tsx` |
| 6 | Bottom nav — swap Profile for Compare | UI update | `components/layout/BottomNav.tsx` |
| 7 | All toasts — add X close button + auto-dismiss timer | Feature | `components/ui/ToastProvider.tsx` (new) or Sonner config |

---

## Fix 1 — Explorer → Dashboard: Added projects not appearing on Dashboard

### Problem
When a user clicks the `+` / `✓` button on the Explorer page, `curatedIds` is saved to localStorage correctly. But the Dashboard page's `curatedUpdated` event listener only fires for **other tabs**, not the same-page interaction. The Dashboard also fetches `curatedIds` once on mount (`useEffect([], [])`). If you navigate from Explorer → Dashboard, the mount fires before the event, so the update is seen. But the `displayResults` `useMemo` was correct — the real issue is the Dashboard event listener fires and updates state, but the `curatedIds` state on Dashboard needs to always reflect localStorage on every visit.

### Root cause
The Dashboard `useEffect` for the `curatedUpdated` event is correct, but the initial load in `useEffect([], [])` does not re-run on client navigation (Next.js App Router keeps component alive in layout). The `curatedIds` state becomes stale.

### Fix

**File: `app/dashboard/page.tsx`**

Replace the two separate `useEffect` blocks that load localStorage and listen for `curatedUpdated` with a single unified refresh function:

```tsx
// Replace these two useEffect blocks:
//   useEffect(() => { ... storage.get ... }, [])
//   useEffect(() => { const handler = () => { setCuratedIds(...) }; window.addEventListener(...) }, [])

// With this single block:
useEffect(() => {
  const refreshFromStorage = () => {
    const intent = storage.get<UserIntent | null>(STORAGE_KEYS.USER_INTENT, null);
    const curated = storage.get<string[]>(STORAGE_KEYS.CURATED_IDS, []);
    const rejected = storage.get<string[]>(STORAGE_KEYS.REJECTED_IDS, []);
    const name = (intent as any)?.name?.split(' ')[0] || '';
    setUserIntent(intent);
    setCuratedIds(curated);
    setRejectedIds(rejected);
    setUserName(name);
  };

  // Run on mount
  refreshFromStorage();

  // Also run whenever Explorer updates curated list
  window.addEventListener('curatedUpdated', refreshFromStorage);

  // Also run when the tab/page gets focus (user navigates back)
  window.addEventListener('focus', refreshFromStorage);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshFromStorage();
  });

  return () => {
    window.removeEventListener('curatedUpdated', refreshFromStorage);
    window.removeEventListener('focus', refreshFromStorage);
  };
}, []);
```

**Also update `app/explore/page.tsx` — `toggleCurated` function:**

After `window.dispatchEvent(new Event('curatedUpdated'))`, also call `storage.set` synchronously (it already does this — confirm the order is: `storage.set` → `dispatchEvent`). This is already correct in the existing code.

**Verify:** Navigate to Explorer, add a project (button turns to ✓), navigate to Dashboard — the project should appear in the grid.

---

## Fix 2 — Profile icon in TopHeader → Human skeleton SVG

### Problem
The top-right profile button shows a generic orange `P` circle. Replace with a clean human silhouette (skeleton icon style).

### Fix

**File: `components/layout/TopHeader.tsx`**

Replace the `<Link href="/profile">` element at the end of the header with:

```tsx
<Link
  href="/profile"
  className="w-8 h-8 rounded-full border-2 border-[var(--border-strong)] 
    bg-[var(--surface-raised)] flex items-center justify-center
    hover:border-[var(--primary)] transition-colors"
  aria-label="Profile"
>
  {/* Human silhouette skeleton icon */}
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className="w-5 h-5 text-[var(--text-muted)]"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    {/* Head */}
    <circle cx="12" cy="7" r="3.5" />
    {/* Body / shoulders */}
    <path
      d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8"
      strokeLinecap="round"
    />
  </svg>
</Link>
```

Remove the `import` of any existing profile-specific icon if unused.

**Note:** This replaces the orange `P` with a universally recognizable person silhouette. The icon is inline SVG — no new package needed.

---

## Fix 3 — Project card: three bullet points stacked vertically, equal width

### Problem
In the project detail page tab view (and on the Explorer/Dashboard cards), the three insight pills (pros/cons tags like "Strong builder brand", "Excellent appreciation potential", "Narrow access roads") appear side by side, overflow on mobile, and are unequal widths.

### Fix

**File: `components/property/InsightsPanel.tsx`**

In the `variant === 'card'` render block, change the `flex flex-wrap gap-2` container for pros to a **vertical stack** where each item is full-width:

```tsx
// BEFORE (variant === 'card'):
<div className="flex flex-wrap gap-2">
  {pros.slice(0, 2).map((pro, i) => (
    <div key={i} className="flex items-center gap-1.5 text-[10px] ...rounded-full...">
      ...
    </div>
  ))}
</div>
<div className="flex flex-wrap gap-2">
  {displayCons.slice(0, 1).map((con, i) => (
    <div key={i} className="flex items-center gap-1.5 text-[10px] ...rounded-full...">
      ...
    </div>
  ))}
</div>

// AFTER — single vertical list, full-width rows:
<div className="flex flex-col gap-1.5">
  {pros.slice(0, 2).map((pro, i) => (
    <div
      key={i}
      className="flex items-center gap-1.5 text-[10px] text-[var(--success)]
        bg-[var(--success)]/5 px-2 py-1 rounded-[var(--radius-xs)]
        border border-[var(--success)]/10 w-full"
    >
      <div className="w-1.5 h-1.5 bg-[var(--success)] rounded-full flex-shrink-0" />
      <span className="line-clamp-1">{pro}</span>
    </div>
  ))}
  {displayCons.slice(0, 1).map((con, i) => (
    <div
      key={i}
      className="flex items-center gap-1.5 text-[10px] text-[var(--danger)]
        bg-[var(--danger)]/5 px-2 py-1 rounded-[var(--radius-xs)]
        border border-[var(--danger)]/10 w-full"
    >
      <div className="w-1.5 h-1.5 bg-[var(--danger)] rounded-full flex-shrink-0" />
      <span className="line-clamp-1">{con}</span>
    </div>
  ))}
</div>
```

**Result:** Each bullet point takes full card width, they are equal-sized, stacked vertically — consistent across both mobile and desktop card views.

---

## Fix 4 — Project detail page: Replace Save button with Add to Dashboard

### Problem
The project detail page (`/projects/[slug]`) has two "Save" / Heart buttons — one in the sticky mobile header and one in the sidebar price card. These should become "Add to Dashboard" buttons. The toast message should say "Added to Dashboard" (not "Saved to shortlist"). The Heart/Save button should be fully removed.

### Fix

**File: `app/projects/[slug]/page.tsx`**

**Step A — Add dashboard state and handler (alongside existing state):**

```tsx
// Add near top with other useState declarations:
const [addedToDashboard, setAddedToDashboard] = useState(false);

// Add this handler (keep handleSaveToShortlist for backward compat if used elsewhere,
// but replace all UI references):
const handleAddToDashboard = () => {
  if (!project) return;
  const curated = storage.get<string[]>(STORAGE_KEYS.CURATED_IDS, []);
  const isAlready = curated.includes(project.id);
  const next = isAlready
    ? curated.filter(id => id !== project.id)
    : [...curated, project.id];
  storage.set(STORAGE_KEYS.CURATED_IDS, next);
  setAddedToDashboard(!isAlready);
  window.dispatchEvent(new Event('curatedUpdated'));
  toast(!isAlready ? 'Added to Dashboard ⭐' : 'Removed from Dashboard');
};

// In the useEffect that loads project, also load dashboard state:
// Add inside the existing project useEffect after setProject:
const curated = storage.get<string[]>(STORAGE_KEYS.CURATED_IDS, []);
setAddedToDashboard(curated.includes(project.id)); // add this line
```

**Step B — In the useEffect where `savedToShortlist` is loaded:**
```tsx
// FIND:
const saved = storage.get<string[]>(STORAGE_KEYS.SAVED_IDS, []);
setSavedToShortlist(saved.includes(project.id));

// ADD AFTER:
const curated = storage.get<string[]>(STORAGE_KEYS.CURATED_IDS, []);
setAddedToDashboard(curated.includes(project.id));
```

**Step C — Replace the sticky mobile header buttons (around line 302):**

```tsx
// REMOVE the Heart/Save button entirely from the mobile sticky header:
// BEFORE:
<button onClick={handleSaveToShortlist} className="p-1.5 text-[var(--text-secondary)]">
  <Heart className={`w-5 h-5 ${savedToShortlist ? 'fill-[var(--danger)] text-[var(--danger)]' : ''}`} />
</button>

// REPLACE WITH:
<button
  onClick={handleAddToDashboard}
  className={`p-1.5 transition-colors ${
    addedToDashboard ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)]'
  }`}
  title={addedToDashboard ? 'Remove from Dashboard' : 'Add to Dashboard'}
>
  <LayoutDashboard className={`w-5 h-5`} />
</button>
```

**Step D — Replace the Share + Save section in the sidebar/price card (around line 942):**

```tsx
// BEFORE: two buttons — Share and Save
// AFTER: Share + Add to Dashboard (remove Save entirely)

{/* Share + Add to Dashboard */}
<div className="flex gap-2">
  <button
    onClick={() => navigator.share?.({ title: project.name, url: window.location.href }).catch(() => {})}
    className="flex-1 flex items-center justify-center gap-2 py-2.5
      border border-[var(--border)] rounded-[var(--radius-xs)] text-sm
      font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] transition-colors"
  >
    <Share2 className="w-4 h-4" /> Share
  </button>
  <button
    onClick={handleAddToDashboard}
    className={`flex-1 flex items-center justify-center gap-2 py-2.5
      border rounded-[var(--radius-xs)] text-sm font-semibold transition-colors ${
      addedToDashboard
        ? 'bg-[var(--primary-light)] border-[var(--primary)]/30 text-[var(--primary)]'
        : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--primary-light)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
    }`}
  >
    <LayoutDashboard className="w-4 h-4" />
    {addedToDashboard ? 'Added ✓' : 'Add to Dashboard'}
  </button>
</div>
```

**Step E — Add `LayoutDashboard` to imports:**
```tsx
// In the lucide-react import line, add LayoutDashboard:
import {
  MapPin, Share2, Heart, ShieldCheck, Download,
  Play, ChevronRight, CheckCircle2, XCircle, X, ZoomIn,
  Building2, Home, CalendarDays, Layers, ArrowLeft, LayoutDashboard
} from "lucide-react";
```

**Step F — Remove unused `Heart` import if `savedToShortlist` state and `handleSaveToShortlist` are no longer used anywhere in the JSX.** (Only remove if fully unused — do a search first.)

---

## Fix 5 — Map: Remove blue box from marker, better tiles, Open in Maps button

### Problem
1. The project marker shows a blue box background artifact (Leaflet `divIcon` default styling bleeds through).
2. The OpenStreetMap tile quality is acceptable but could be crisper.
3. No "Open in Maps" button to launch device native maps.

### Fix A — Remove blue box from marker

**File: `components/map/ProjectMarker.tsx`**

The `L.divIcon` gets a default blue focus outline from Leaflet. Fix by resetting all default Leaflet marker styles:

```tsx
const icon = L.divIcon({
  className: '',  // ← CRITICAL: empty string removes ALL default Leaflet icon styling (the blue box)
  html: `
    <div style="
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #FF5722;
      color: white;
      padding: 6px 12px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 12px;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      border: 2px solid white;
      transform: translateX(-50%);
      position: relative;
    ">
      📍 ${priceLabel}
    </div>
  `,
  iconSize: [0, 0],
  iconAnchor: [0, 16],
  popupAnchor: [0, -20],
});
```

**Also add this CSS to `app/globals.css`** to fully suppress Leaflet's blue focus ring on divIcons:

```css
/* Suppress Leaflet divIcon default blue box */
.leaflet-marker-icon {
  background: none !important;
  border: none !important;
}
```

### Fix B — Better map tiles (Carto Light — sharper and cleaner than OSM default)

**File: `components/map/MapView.tsx`**

Replace the TileLayer url:

```tsx
// BEFORE:
<TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

// AFTER (Carto Positron — crisp, clean, high contrast, free, no API key):
<TileLayer
  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  maxZoom={19}
/>
```

### Fix C — "Open in Maps" button

**File: `components/map/LocationSection.tsx`**

Add an "Open in Maps" button below the map/nearby tab selector. This button uses a universal geo: URL that opens Apple Maps on iOS, Google Maps on Android/desktop:

```tsx
// Add this import at the top:
import { ExternalLink } from "lucide-react";

// Add this JSX right after the sub-tabs div and before the map/nearby content:
<a
  href={`https://maps.google.com/?q=${lat},${lng}`}
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center gap-1.5 text-xs font-semibold
    text-[var(--primary)] hover:underline"
>
  <ExternalLink className="w-3.5 h-3.5" />
  Open in Maps
</a>
```

**How it works:** `https://maps.google.com/?q=LAT,LNG` — on iOS Safari, the OS intercepts and prompts to open in Apple Maps or Google Maps. On Android, opens Google Maps app. On desktop, opens Google Maps browser. No complex geo: URI needed.

---

## Fix 6 — Bottom nav: Replace Profile with Compare

### Problem
Mobile bottom nav shows: Home | Explore | AI Chat | Profile
Profile already exists as a button in the top-right header. Bottom slot should be Compare instead.

### Fix

**File: `components/layout/BottomNav.tsx`**

```tsx
// BEFORE:
import { Home, Compass, Sparkles, User } from "lucide-react";

const NAV_ITEMS = [
  { label: 'Home',     href: '/dashboard', icon: Home },
  { label: 'Explore',  href: '/explore',   icon: Compass },
  { label: 'AI Chat',  href: '/ai-chat',   icon: Sparkles },
  { label: 'Profile',  href: '/profile',   icon: User },
];

// AFTER:
import { Home, Compass, Sparkles, GitCompareArrows } from "lucide-react";

const NAV_ITEMS = [
  { label: 'Home',    href: '/dashboard', icon: Home },
  { label: 'Explore', href: '/explore',   icon: Compass },
  { label: 'AI Chat', href: '/ai-chat',   icon: Sparkles },
  { label: 'Compare', href: '/compare',   icon: GitCompareArrows },
];
```

**Note:** `GitCompareArrows` is available in `lucide-react`. If not found in your installed version, use `ArrowLeftRight` or `Columns` as fallback.

---

## Fix 7 — All toasts: Add X close button + auto-dismiss timer

### Problem
Sonner toasts auto-dismiss but have no manual X button for users who want to close immediately. All popup messages (toast notifications) should have a dismiss button.

### Fix

**File: `app/layout.tsx`** (or wherever `<Toaster />` from sonner is configured)

Update the Toaster component with custom duration and closeButton prop:

```tsx
// Find the <Toaster /> component and update:

// BEFORE (likely):
<Toaster />

// AFTER:
<Toaster
  position="bottom-center"
  closeButton={true}
  duration={4000}
  toastOptions={{
    style: {
      borderRadius: 'var(--radius)',
      fontSize: '13px',
      fontWeight: '600',
      padding: '12px 16px',
    },
    classNames: {
      closeButton: 'bg-transparent border-none text-current opacity-60 hover:opacity-100',
    },
  }}
/>
```

**This gives you:**
- `closeButton={true}` — Sonner renders an X button on each toast natively
- `duration={4000}` — auto-dismisses after 4 seconds
- Both work simultaneously: user can X out early, or toast auto-dismisses

**If Sonner's built-in closeButton doesn't render visibly** (version-dependent), add this to `app/globals.css`:

```css
/* Ensure Sonner close button is visible */
[data-sonner-toaster] [data-close-button] {
  display: flex !important;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  transition: opacity 0.15s;
}
[data-sonner-toaster] [data-close-button]:hover {
  opacity: 1;
}
```

---

## Execution order for Cursor / Claude Code

Run these one at a time in this order. After each fix, verify in browser before moving to next:

```
[ ] Fix 1: Explorer → Dashboard sync (app/dashboard/page.tsx)
[ ] Fix 2: Profile icon skeleton (components/layout/TopHeader.tsx)
[ ] Fix 3: Bullet points stacked (components/property/InsightsPanel.tsx)
[ ] Fix 4: Save → Add to Dashboard (app/projects/[slug]/page.tsx)
[ ] Fix 5a: Map marker blue box (components/map/ProjectMarker.tsx + globals.css)
[ ] Fix 5b: Better map tiles (components/map/MapView.tsx)
[ ] Fix 5c: Open in Maps button (components/map/LocationSection.tsx)
[ ] Fix 6: Bottom nav Compare (components/layout/BottomNav.tsx)
[ ] Fix 7: Toast X button (app/layout.tsx + globals.css)
```

---

## Prompt to paste at start of session

```
I'm working on Propcinity, a Next.js 14 App Router project using TypeScript, Tailwind CSS, Lucide React, Framer Motion, and Sonner for toasts. The project uses localStorage (via a `storage` utility at `@/lib/storage`) for user state like curatedIds, savedIds, and userIntent.

Please apply the fixes from PROPCINITY_FIXES.md one at a time. Start with Fix 1 (Explorer → Dashboard sync). After each fix:
1. Show me the exact before/after diff
2. Confirm which file was changed
3. Do not touch any other files
4. Do not break existing TypeScript types

Begin with Fix 1.
```

---

## Notes & cautions

- **Do not** change the Supabase schema or API routes for any of these fixes — all changes are purely frontend/component-level.
- **Do not** add new npm packages. All icons come from `lucide-react` (already installed). Map tiles use CDN URLs (no package).
- `storage.get` and `storage.set` are safe to call in `useEffect` only — never during SSR.
- After Fix 4, you can safely delete the `savedToShortlist` state and `handleSaveToShortlist` function if they are confirmed unused. Do a full-file search for `savedToShortlist` before deleting.
- Carto tiles (`basemaps.cartocdn.com`) are free for open/non-commercial use and do not require an API key for reasonable traffic.