# Propcinity — Motion System Fix + "0" Rendering Bug

Paste this whole file into Cursor (Composer/Agent mode) as your prompt. It contains the diagnosed root causes, exact file locations, and the changes to make. Codebase: Next.js + Tailwind + Framer Motion.

---

## Context

Two issues to fix across the codebase:

1. **A stray "0" renders on project pages** next to builder stats (e.g. "15+ years experience 0").
2. **Animations feel broken/janky** — one global animation runs at 600ms, some transitions animate non-compositor properties, some use spring/bounce where it doesn't belong, and there's no `prefers-reduced-motion` handling outside one component.

---

## Bug 1 — Stray "0" after builder stats

### Root cause
In `components/property/ProjectDetailClient.tsx` (~lines 1054–1064), the code uses JavaScript truthy `&&` to conditionally render:

```tsx
{project.builderYearsExperience && (
  <p className="text-xs text-[var(--text-muted)]">
    {project.builderYearsExperience}+ years experience
  </p>
)}
{project.builderCompletedProjects && (
  <p className="text-xs text-[var(--text-muted)]">
    {project.builderCompletedProjects}+ completed projects
  </p>
)}
```

When `builderCompletedProjects` (or `builderYearsExperience`) is the **number `0`** — a legitimate value, not "missing data" — `0 && (<p>...)` evaluates to `0`, and React renders that literal `0` as a text node. This is a classic React footgun: only `undefined`, `null`, `false`, and `''` are safe to short-circuit render with `&&`; `0` is not.

### Fix
Replace truthy checks with explicit null/undefined checks everywhere a numeric field gates JSX. Do this in `ProjectDetailClient.tsx` and audit `ProjectCard.tsx` and `BuilderProfile.tsx` (`components/property/BuilderProfile.tsx`) for the same pattern, since these are the three "project component" files that render builder/project numeric stats.

```tsx
{project.builderYearsExperience != null && (
  <p className="text-xs text-[var(--text-muted)]">
    {project.builderYearsExperience}+ years experience
  </p>
)}
{project.builderCompletedProjects != null && (
  <p className="text-xs text-[var(--text-muted)]">
    {project.builderCompletedProjects}+ completed projects
  </p>
)}
```

`!= null` catches both `null` and `undefined` while leaving `0` alone to render normally.

### To-do
- [ ] Fix lines ~1054 and ~1059 in `components/property/ProjectDetailClient.tsx` as shown above.
- [ ] Grep the whole repo for the anti-pattern and fix every instance where the gated value is a `number`:
  ```bash
  grep -rnE "\{[a-zA-Z0-9_.]+\s*&&\s*\(" components/ app/ --include="*.tsx"
  ```
  For each match, check the TypeScript type of the field. If it's `number | undefined` (not `boolean` or an object/array), switch `&&` to `!= null` (or `Number.isFinite(x)` if you want to also guard against `NaN`).
- [ ] In `components/property/BuilderProfile.tsx`, `projectsDelivered` is rendered unconditionally (`{projectsDelivered}+ Projects`) — confirm the parent never passes `undefined` there, or add a guard consistent with the above.
- [ ] Add a lightweight ESLint rule note / team convention: never use `value && <JSX/>` when `value` can be a number — use `value != null &&`, `Boolean(value) &&` only when 0 truly means "hide", or a ternary.

---

## Bug 2 — Animation system overhaul

Apply these six principles as concrete rules, then fix the specific offending files.

### Rules (encode as constants, don't hand-tune per component)

1. **Duration**: 150–250ms for all interface motion (hovers, dropdowns, sheets, fades, tab switches). Nothing longer unless it's a full-page transition or a one-time celebratory moment.
2. **Easing**: never `linear`. Default to ease-out (`cubic-bezier(0.16, 1, 0.3, 1)` — fast start, gentle settle) for anything entering/appearing. Use ease-in-out for things that move and stay on screen (tab indicators, toggles).
3. **Overshoot**: no spring/bounce on routine UI (dropdowns, cards, sheets). Reserve spring physics for one-off celebration moments only (e.g. "added to compare" confirmation, success checkmarks) — not on every open/close.
4. **Origin**: any menu/popover/dropdown that grows from a trigger must set `transform-origin` to that trigger's position, not default center/top-left.
5. **Reduced motion**: wrap every custom animation in a `prefers-reduced-motion: reduce` fallback that swaps motion for a plain opacity fade (or removes it entirely) — not "no fallback."
6. **Compositor-safe properties only**: animate `transform` and `opacity`. Never animate `width`, `height`, `top`, `left`, `margin`, or `max-height` for anything meant to look smooth — these trigger layout/repaint on every frame and tank to ~12fps on real devices even though they look identical to `transform: scale()` in a static mockup.

### Step-by-step file changes

**1. `tailwind.config.ts`** — this is the actual source of the 600ms issue. It's used by `FadeIn.tsx` on cards/sections throughout the app.

```ts
// BEFORE
keyframes: {
  'fade-in-up': {
    '0%': { opacity: '0', transform: 'translateY(16px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
},
animation: {
  'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
},

// AFTER
keyframes: {
  'fade-in-up': {
    '0%': { opacity: '0', transform: 'translateY(12px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
},
animation: {
  'fade-in-up': 'fade-in-up 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
},
```

**2. `app/globals.css`** — add a global reduced-motion rule so every custom `@keyframes` animation in the app (not just the cookie banner's `slide-up`) respects the OS setting in one place, instead of per-component opt-in:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
Keep the existing component-specific `@media (prefers-reduced-motion: reduce)` block for `.animate-slide-up` too — the global rule above is a safety net, not a replacement, since it neutralizes duration but doesn't rewrite fly-in transforms to fades. For any animation using a translateY/scale entrance (like `fade-in-up` and the cookie banner's `slide-up`), add an explicit reduced-motion variant that swaps to opacity-only:

```css
@media (prefers-reduced-motion: reduce) {
  .animate-slide-up { animation: none; opacity: 1; transform: none; }
}
```
(`fade-in-up`'s keyframe already ends at `translateY(0)`, so the global duration-zero rule effectively makes it an instant fade — fine as-is once the global rule above is added.)

**3. `components/property/CompareBar.tsx`** (lines ~68–195) — Framer Motion `motion.div`/`motion.button` blocks have no explicit `transition` prop, so Framer falls back to spring defaults on `y`, `opacity`, and `scale`. That's bounce on every add/remove — should be reserved for the one moment it's actually a celebration (if any). Add explicit tween transitions:

```tsx
// Bar container — was: initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
<motion.div
  initial={{ y: 100, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  exit={{ y: 100, opacity: 0 }}
  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
  style={{ transformOrigin: 'bottom center' }}
>

// Compare-item chips — was: initial/animate/exit with scale 0.8–0.9, no transition
<motion.div
  layout
  initial={{ opacity: 0, scale: 0.92 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.92 }}
  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
>
```
If there's a specific "added to compare" success state, that's the one place a subtle spring (`type: 'spring', stiffness: 400, damping: 25`) is appropriate — everywhere else in this file should be tween.

**4. `components/ui/PageTransition.tsx`** — already correct (opacity-only, `duration: 0.16`, `ease: 'easeOut'`). No change needed; use this as the reference pattern for other Framer Motion usage.

**5. Dropdowns / popovers / bottom sheets** (`components/conversion/LeadQualificationSheet.tsx`, `components/ai/AskAIModal.tsx`, any `GuestGate`-wrapped popovers, mobile filter sheets in `components/property/ExploreClient.tsx`) — audit each for:
   - explicit `transform-origin` set to the trigger element/edge (e.g. bottom sheets: `transform-origin: bottom center`; dropdowns anchored to a button: origin at that corner).
   - entrance/exit using `transform: translateY()` / `scale()` + `opacity`, never `height`/`max-height` to reveal content.
   - duration in the 150–250ms band via Tailwind's `duration-200` or Framer `transition={{ duration: 0.2 }}`.

**6. Existing Tailwind `duration-*` usages to review** (found via `grep -rn "duration-[0-9]" --include="*.tsx" .`):
   - `duration-500` in `components/property/ProjectCard.tsx` (image hover zoom) and `components/blogs/BlogListClient.tsx` — 500ms is fine for a slow, deliberate hover-zoom (not "interface motion" in the strict sense), but consider dropping to `duration-300`–`400` for consistency; use judgment, this isn't a state-change interaction.
   - `duration-150`, `duration-200`, `duration-300` elsewhere are already within or close to the target band — leave as-is.
   - Confirm none of these animate `width`/`height` — spot-check `components/property/UnitConfigCard.tsx:77` and `components/property/GallerySlider.tsx:84` (both currently animate `transform`/`opacity`, which is correct — keep it that way going forward).

### To-do
- [ ] Update `tailwind.config.ts`: `fade-in-up` animation duration 0.6s → 220ms, easing → `cubic-bezier(0.16, 1, 0.3, 1)`.
- [ ] Add global `prefers-reduced-motion` block to `app/globals.css` (safety net) plus an explicit opacity-only fallback for `.animate-slide-up`.
- [ ] Add explicit `transition={{ duration, ease }}` to every `motion.div`/`motion.button` in `components/property/CompareBar.tsx` (remove implicit spring defaults); reserve real spring for a single "added" celebration state if one exists.
- [ ] Set explicit `transform-origin` on any popover/dropdown/sheet component to match its trigger/edge.
- [ ] Audit `LeadQualificationSheet.tsx`, `AskAIModal.tsx`, and the mobile filter sheet in `ExploreClient.tsx` for entrance/exit animation — ensure `transform` + `opacity` only, duration 150–250ms, correct origin.
- [ ] Grep for any `transition-all` / animated `width`/`height`/`max-height` and replace with `transform: scaleX()`/`scale()` equivalents:
  ```bash
  grep -rn "transition-all\|animate.*width\|animate.*height" --include="*.tsx" components/ app/
  ```
- [ ] Standardize the "duration-500" hover-zoom cases to `duration-300`–`400` for visual consistency across `ProjectCard.tsx` and `BlogListClient.tsx` (optional polish, not a bug).
- [ ] Manually test with OS-level "Reduce Motion" enabled (macOS: System Settings → Accessibility → Display; Windows: Settings → Accessibility → Visual effects) and confirm every animation degrades to a fade or is disabled — not skipped mid-flight.

---

## Acceptance criteria

- No numeric field ever renders as a bare `0` anywhere builder/project stats are shown.
- No custom animation in the app exceeds ~250ms except full-page transitions (already fine) and slow hover-zooms.
- No animation uses `linear` easing.
- No dropdown/menu/sheet uses spring/bounce for routine open/close.
- Every popover/dropdown grows from its trigger's `transform-origin`.
- `prefers-reduced-motion: reduce` degrades every animation to a fade (or none), verified manually.
- No animation targets `width`, `height`, `top`, `left`, or `margin`.