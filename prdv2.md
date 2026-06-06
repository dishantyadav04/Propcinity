# Propcinity — Fix: Registered Users Redirected to Onboarding on Reload

## Root Cause

**File: `hooks/useGuestMode.ts`**

The hook initialises `isGuest` as `true` by default:

```ts
const [isGuest, setIsGuest] = useState(true) // ← the bug
```

localStorage can only be read client-side, inside a `useEffect`. This means on the very first render — before `useEffect` runs — `isGuest` is always `true` for every user, including fully registered ones.

Every page that does this:

```ts
useEffect(() => {
  if (isGuest) router.replace('/onboarding') // fires on first render!
}, [isGuest, router])
```

...fires the redirect immediately on the first render, before the hook has had a chance to check localStorage. The registered user gets bounced to `/onboarding` before the correction ever happens.

---

## The Fix — Two Parts

### Part 1 — Fix `hooks/useGuestMode.ts`

Add a third state: `isChecking`. This is `true` until localStorage has been read. All redirect logic must wait for `isChecking` to be `false`.

**Replace the entire file with:**

```ts
'use client'

import { useEffect, useState } from 'react'
import { storage, STORAGE_KEYS } from '@/lib/storage'

export function useGuestMode() {
  // null = not yet checked (first render, localStorage not read yet)
  // true = confirmed guest (onboarding not done)
  // false = confirmed registered (onboarding done)
  const [isGuest, setIsGuest] = useState<boolean | null>(null)

  useEffect(() => {
    const done = storage.get<boolean>(STORAGE_KEYS.ONBOARDING_DONE, false)
    setIsGuest(!done)
  }, [])

  return {
    isGuest: isGuest === true,        // only true AFTER confirmed as guest
    isRegistered: isGuest === false,  // only true AFTER confirmed as registered
    isChecking: isGuest === null,     // true during the first render window
  }
}
```

**Why this works:** `isGuest === null` on first render means nothing fires until the `useEffect` has run and set the real value. The redirect only triggers once `isChecking` is `false` and `isGuest` is `true` — i.e. genuinely a guest.

---

### Part 2 — Update Every File That Uses `useGuestMode`

Every file that imports `useGuestMode` must now destructure `isChecking` and guard against it. Apply the pattern below to each file listed.

---

#### Pattern A — Pages with Hard Redirect (Dashboard, Profile, sub-pages)

Replace the current redirect + spinner block with this pattern:

```tsx
const { isGuest, isChecking } = useGuestMode()

// Guard: wait until localStorage is read before redirecting
useEffect(() => {
  if (isChecking) return
  if (isGuest) router.replace('/onboarding')
}, [isGuest, isChecking, router])

// Show spinner while checking — prevents flash of content or premature redirect
if (isChecking || isGuest) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// Only renders when isChecking = false AND isGuest = false (confirmed registered)
```

> The spinner shows for both `isChecking` and `isGuest` states. For a registered user: spinner shows briefly during check → check completes → `isRegistered` is true → full page renders. For a guest: spinner shows → check completes → redirect fires. The spinner duration is imperceptible (one render cycle, <16ms).

---

#### Pattern B — Pages/Components with Partial Gating (no redirect, just locked UI)

For pages/components that don't redirect but use `isGuest` to show/hide locked UI (Explore, Compare, Project Detail, TopHeader, BottomNav, ProjectCard), the fix is simpler — just treat `isChecking` the same as `isGuest = false` (i.e. show full content while checking, then apply locks once confirmed):

```tsx
const { isGuest, isChecking } = useGuestMode()

// While checking, treat as registered (show full content, no locks)
// Once confirmed, apply guest restrictions if isGuest === true
const guestMode = !isChecking && isGuest
```

Then replace every usage of `isGuest` in that file with `guestMode`.

---

## File-by-File Instructions

### 1. `hooks/useGuestMode.ts`
Replace entirely with the new version from Part 1 above.

---

### 2. `app/dashboard/page.tsx` — Pattern A

**Current broken code (around line 142–156):**
```tsx
const { isGuest } = useGuestMode()

useEffect(() => {
  if (isGuest) router.replace('/onboarding')
}, [isGuest, router])

if (isGuest) {
  return (<spinner />)
}

// useState declarations below ← also a Rules of Hooks violation
const [projects, setProjects] = useState(...)
```

**Replace with Pattern A.** Also remember: all `useState` declarations must be above this block (the Rules of Hooks fix from the previous prompt). Final order:

```tsx
// 1. All hooks first — unconditionally
const router = useRouter()
const { isGuest, isChecking } = useGuestMode()
const [projects, setProjects] = useState<Project[]>([])
const [userIntent, setUserIntent] = useState<UserIntent | null>(null)
const [isLoading, setIsLoading] = useState(true)
const [aiLoading, setAiLoading] = useState(false)
const [storageReady, setStorageReady] = useState(false)
const [aiRecommended, setAiRecommended] = useState<string[]>([])
const [curatedIds, setCuratedIds] = useState<string[]>([])
const [rejectedIds, setRejectedIds] = useState<string[]>([])
const [userName, setUserName] = useState<string>('')

// 2. All useEffects — unconditionally
useEffect(() => {
  if (isChecking) return
  if (isGuest) router.replace('/onboarding')
}, [isGuest, isChecking, router])

useEffect(() => {
  // existing storage load effect — keep exactly as-is
}, [/* existing deps */])

// 3. Conditional returns AFTER all hooks
if (isChecking || isGuest) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// 4. Rest of page renders here
```

---

### 3. `app/profile/page.tsx` — Pattern A

**Current:**
```tsx
const { isGuest } = useGuestMode()
useEffect(() => {
  if (isGuest) router.replace('/onboarding')
}, [isGuest, router])
if (isGuest) { return (<spinner />) }
```

**Replace with:**
```tsx
const { isGuest, isChecking } = useGuestMode()
useEffect(() => {
  if (isChecking) return
  if (isGuest) router.replace('/onboarding')
}, [isGuest, isChecking, router])
if (isChecking || isGuest) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
```

---

### 4. `app/profile/preferences/page.tsx` — Pattern A

Same replacement as profile/page.tsx:
```tsx
const { isGuest, isChecking } = useGuestMode()
useEffect(() => {
  if (isChecking) return
  if (isGuest) router.replace('/onboarding')
}, [isGuest, isChecking, router])
if (isChecking || isGuest) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
```

---

### 5. `app/profile/personal-info/page.tsx` — Pattern A

Same replacement:
```tsx
const { isGuest, isChecking } = useGuestMode()
useEffect(() => {
  if (isChecking) return
  if (isGuest) router.replace('/onboarding')
}, [isGuest, isChecking, router])
if (isChecking || isGuest) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
```

---

### 6. `app/profile/privacy/page.tsx` — Pattern A

This page also has the same redirect bug AND a Rules of Hooks violation (useState after early return). Fix both:

```tsx
// All hooks first
const router = useRouter()
const { isGuest, isChecking } = useGuestMode()
const [notifications, setNotifications] = useState({ email: true, whatsapp: false, updates: true })

// useEffect after hooks
useEffect(() => {
  if (isChecking) return
  if (isGuest) router.replace('/onboarding')
}, [isGuest, isChecking, router])

// Conditional return after all hooks
if (isChecking || isGuest) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
```

> Note: This also fixes the Rules of Hooks violation on this page — `useState({ email, whatsapp, updates })` was previously after the early return.

---

### 7. `app/projects/[slug]/page.tsx` — Pattern B

This page doesn't redirect. It just gates certain UI for guests. Use Pattern B:

```tsx
// Before:
const { isGuest } = useGuestMode()

// After:
const { isGuest: isGuestRaw, isChecking } = useGuestMode()
const isGuest = !isChecking && isGuestRaw  // false during check, true only when confirmed
```

No other changes needed. All existing `isGuest` usages in this file will now correctly show full content during the check window, then apply locks once confirmed.

---

### 8. `app/explore/page.tsx` — Pattern B

```tsx
// Before:
const { isGuest } = useGuestMode()

// After:
const { isGuest: isGuestRaw, isChecking } = useGuestMode()
const isGuest = !isChecking && isGuestRaw
```

No other changes. All `isGuest` checks in the file automatically benefit.

---

### 9. `app/compare/page.tsx` — Pattern B

```tsx
// Before:
const { isGuest } = useGuestMode()

// After:
const { isGuest: isGuestRaw, isChecking } = useGuestMode()
const isGuest = !isChecking && isGuestRaw
```

---

### 10. `components/layout/TopHeader.tsx` — Pattern B

```tsx
// Before:
const { isGuest } = useGuestMode()

// After:
const { isGuest: isGuestRaw, isChecking } = useGuestMode()
const isGuest = !isChecking && isGuestRaw
```

While `isChecking` is true, `isGuest` resolves to `false` — so the header renders as if the user is registered (shows profile avatar, shows Dashboard in nav). This is the correct behaviour: don't flash "Sign Up / Login" to a registered user for even one frame.

---

### 11. `components/layout/BottomNav.tsx` — Pattern B

```tsx
// Before:
const { isGuest } = useGuestMode()

// After:
const { isGuest: isGuestRaw, isChecking } = useGuestMode()
const isGuest = !isChecking && isGuestRaw
```

While checking, `isGuest = false` so `USER_NAV_ITEMS` renders (correct — no flicker of guest nav for registered users).

---

### 12. `components/property/ProjectCard.tsx` — Pattern B

```tsx
// Before:
const { isGuest } = useGuestMode()

// After:
const { isGuest: isGuestRaw, isChecking } = useGuestMode()
const isGuest = !isChecking && isGuestRaw
```

---

## Summary of All Changes

| File | Pattern | What Changes |
|---|---|---|
| `hooks/useGuestMode.ts` | — | Add `null` initial state, expose `isChecking` + `isRegistered` |
| `app/dashboard/page.tsx` | A | Guard redirect with `isChecking`, fix hook order |
| `app/profile/page.tsx` | A | Guard redirect with `isChecking` |
| `app/profile/preferences/page.tsx` | A | Guard redirect with `isChecking` |
| `app/profile/personal-info/page.tsx` | A | Guard redirect with `isChecking` |
| `app/profile/privacy/page.tsx` | A | Guard redirect with `isChecking`, fix hook order |
| `app/projects/[slug]/page.tsx` | B | Derive `isGuest` from `!isChecking && isGuestRaw` |
| `app/explore/page.tsx` | B | Derive `isGuest` from `!isChecking && isGuestRaw` |
| `app/compare/page.tsx` | B | Derive `isGuest` from `!isChecking && isGuestRaw` |
| `components/layout/TopHeader.tsx` | B | Derive `isGuest` from `!isChecking && isGuestRaw` |
| `components/layout/BottomNav.tsx` | B | Derive `isGuest` from `!isChecking && isGuestRaw` |
| `components/property/ProjectCard.tsx` | B | Derive `isGuest` from `!isChecking && isGuestRaw` |

**1 hook file changed. 11 consumer files updated. No new files. No route changes.**

---

## Implementation Order

```
1. hooks/useGuestMode.ts          ← fix the root first
2. app/dashboard/page.tsx         ← highest priority (was redirecting registered users)
3. app/profile/page.tsx           ← same
4. app/profile/preferences/page.tsx
5. app/profile/personal-info/page.tsx
6. app/profile/privacy/page.tsx
7. components/layout/TopHeader.tsx
8. components/layout/BottomNav.tsx
9. components/property/ProjectCard.tsx
10. app/explore/page.tsx
11. app/compare/page.tsx
12. app/projects/[slug]/page.tsx
```

After step 1, test immediately by: completing onboarding, then refreshing `/dashboard` — it should stay on dashboard. Then clear localStorage and refresh `/dashboard` — it should redirect to `/onboarding`.