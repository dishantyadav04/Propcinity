# Propcinity — Bug Fix Prompt for Cursor IDE

> **Instructions for Cursor:** Work through each task in order. Each task is self-contained with exact file paths, the problem, and what to build. Do not skip tasks or reorder them — later tasks depend on earlier ones. After each task, confirm the change compiles before moving on.

---

## Context

This is a Next.js 14 App Router project with Supabase (Postgres), Zod validation, Tailwind CSS, and shadcn/ui. The admin panel allows managing real estate projects. The stack: `app/` for routes, `components/admin/` for admin UI, `services/projects.ts` for DB logic, `lib/schema.sql` for DB schema, `types/project.ts` for TypeScript types.

---

## TASK 1 — Fix the DB Schema: Add Missing Columns to `projects` Table

**File:** `lib/schema.sql`

**Problem:** The `projects_public` view references ~15 columns that are never declared in the base `CREATE TABLE projects` block. The view will fail to create or silently return NULLs.

**What to do:** Add the following columns to the `CREATE TABLE projects` statement (after `construction_percent`):

```sql
-- Builder info (denormalised for display)
builder_id uuid references builders,
builder_years_experience integer,
builder_completed_projects integer,
builder_cities text[] default '{}',
builder_top_projects jsonb default '[]'::jsonb,
builder_description text,

-- RERA
rera_link text,
rera_possession_date date,

-- Project specs
land_parcel_acres numeric,
total_towers integer,
floors_per_tower text,

-- Legal
litigation boolean default false,
litigation_details text,
commencement_certificate boolean default false,
occupancy_certificate boolean default false,
legal_notes text,

-- Financial
payment_plans jsonb default '[]'::jsonb,
bank_approvals jsonb default '[]'::jsonb,

-- Media
videos jsonb default '[]'::jsonb,
brochure_url text,
```

Also fix the `construction_status` CHECK constraint — add `new_launch`:

```sql
-- BEFORE
construction_status text check (
  construction_status in ('pre_launch','under_construction','ready_to_move')
)

-- AFTER
construction_status text check (
  construction_status in ('pre_launch','new_launch','under_construction','ready_to_move')
)
```

**Create a new migration file** at `supabase/migrations/20260605_missing_project_columns.sql`:

```sql
-- Add missing columns to projects table
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS builder_years_experience INTEGER,
  ADD COLUMN IF NOT EXISTS builder_completed_projects INTEGER,
  ADD COLUMN IF NOT EXISTS builder_cities TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS builder_top_projects JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS builder_description TEXT,
  ADD COLUMN IF NOT EXISTS rera_link TEXT,
  ADD COLUMN IF NOT EXISTS rera_possession_date DATE,
  ADD COLUMN IF NOT EXISTS land_parcel_acres NUMERIC,
  ADD COLUMN IF NOT EXISTS total_towers INTEGER,
  ADD COLUMN IF NOT EXISTS floors_per_tower TEXT,
  ADD COLUMN IF NOT EXISTS litigation BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS litigation_details TEXT,
  ADD COLUMN IF NOT EXISTS commencement_certificate BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS occupancy_certificate BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS legal_notes TEXT,
  ADD COLUMN IF NOT EXISTS payment_plans JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS bank_approvals JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS brochure_url TEXT;

-- Fix construction_status to include new_launch
ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_construction_status_check;

ALTER TABLE projects
  ADD CONSTRAINT projects_construction_status_check
  CHECK (construction_status IN ('pre_launch','new_launch','under_construction','ready_to_move'));
```

**Run this migration** against your Supabase project.

---

## TASK 2 — Fix the API Route: Add Missing Fields to Zod Schema + Fix PATCH Routing

**File:** `app/api/admin/projects/route.ts`

**Problem A:** The `projectSchema` Zod object is missing ~15 fields so they are silently stripped on every save.

**Problem B:** The `PATCH` and `PUT` handlers read `id` from `?id=` query params, but `ProjectForm.tsx` sends the request to `/api/admin/projects/${id}` (a path param). There is no `/api/admin/projects/[id]/route.ts`, so every edit **404s**.

**Fix A — Add missing fields to `projectSchema`:**

```ts
const projectSchema = z.object({
  // ... keep all existing fields, then ADD:
  builder_id: z.string().uuid().optional().nullable(),
  builder_years_experience: z.number().int().optional().nullable(),
  builder_completed_projects: z.number().int().optional().nullable(),
  builder_cities: z.array(z.string()).optional().default([]),
  builder_top_projects: z.array(z.object({ name: z.string(), location: z.string() })).optional().default([]),
  builder_description: z.string().optional().nullable(),
  tagline: z.string().optional(),
  rera_link: z.string().optional().nullable(),
  rera_expiry: z.string().optional().nullable(),
  rera_possession_date: z.string().optional().nullable(),
  land_parcel_acres: z.number().optional().nullable(),
  total_towers: z.number().int().optional().nullable(),
  floors_per_tower: z.string().optional().nullable(),
  total_units: z.number().int().optional().nullable(),
  available_units: z.number().int().optional().nullable(),
  litigation: z.boolean().optional().default(false),
  litigation_details: z.string().optional().nullable(),
  commencement_certificate: z.boolean().optional().nullable(),
  occupancy_certificate: z.boolean().optional().nullable(),
  legal_notes: z.string().optional().nullable(),
  payment_plans: z.array(z.object({ name: z.string(), description: z.string() })).optional().default([]),
  bank_approvals: z.array(z.object({ bankName: z.string(), logoUrl: z.string().optional() })).optional().default([]),
  videos: z.array(z.object({ label: z.string(), youtubeUrl: z.string() })).optional().default([]),
  brochure_url: z.string().optional().nullable(),
  // Fix construction_status enum:
  construction_status: z.enum(['pre_launch', 'new_launch', 'under_construction', 'ready_to_move']).optional(),
})
```

**Fix B — Create a new dynamic route file** at `app/api/admin/projects/[id]/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { adminUpdateProject, adminDeleteProject } from '@/services/projects'

// Re-use the same projectSchema from the parent route — move it to a shared lib/project-schema.ts and import here
import { projectSchema } from '@/lib/project-schema'

const unauth = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthenticated(request)) return unauth()

  const id = params.id
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const body = await request.json().catch(() => null)
  const parsed = projectSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid project payload', details: parsed.error.flatten() }, { status: 400 })
  }

  await adminUpdateProject(id, parsed.data)
  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthenticated(request)) return unauth()

  const id = params.id
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  await adminDeleteProject(id)
  return NextResponse.json({ success: true })
}
```

**Also create** `lib/project-schema.ts` and move `projectSchema` and `unitConfigSchema` there so both route files can import them without duplication.

---

## TASK 3 — Fix the Admin Form: Add All Missing Input Fields

**File:** `components/admin/ProjectForm.tsx`

**Problem:** The following fields have state but no UI inputs, or are completely missing from state and UI.

**Add a new section called "Project Specs & Dates"** between "General Information" and "Geography". Include these inputs:

```
┌─────────────────────────────────────────────────────────┐
│  PROJECT SPECS & DATES                                  │
│                                                         │
│  [Tagline]              [Launch Date]                   │
│  [Target Possession]    [RERA Possession Date]          │
│  [Total Units]          [Available Units]               │
│  [Land Parcel (acres)]  [Total Towers]                  │
│  [Floors Per Tower]     [Construction Status ▾]         │
└─────────────────────────────────────────────────────────┘
```

**Add a "Legal & Compliance" section** after RERA Registrations:

```
┌─────────────────────────────────────────────────────────┐
│  LEGAL & COMPLIANCE                                     │
│                                                         │
│  [✓] Litigation         [Litigation Details text]       │
│  [✓] Commencement Cert  [✓] Occupancy Cert             │
│  [Legal Notes textarea]                                 │
└─────────────────────────────────────────────────────────┘
```

**Add a "Media & Documents" section** after Master Plan Images:

```
┌─────────────────────────────────────────────────────────┐
│  MEDIA & DOCUMENTS                                      │
│                                                         │
│  Brochure URL: [_________________________]              │
│                                                         │
│  Videos (YouTube)                                       │
│  [Label]  [YouTube URL]  [+ Add]                       │
│  ── listed below ──                                     │
└─────────────────────────────────────────────────────────┘
```

**Add a "Payment Plans & Bank Approvals" section** after Legal:

```
┌─────────────────────────────────────────────────────────┐
│  PAYMENT PLANS                                          │
│  [Plan Name]  [Description]  [+ Add]                   │
│                                                         │
│  BANK APPROVALS                                         │
│  [Bank Name]  [Logo URL]  [+ Add]                      │
└─────────────────────────────────────────────────────────┘
```

**Update initial state** to include all new fields:
```ts
const [project, setProject] = useState<Partial<Project>>(initialData || {
  // existing fields...
  tagline: '',
  possessionDate: '',
  reraPossessionDate: '',
  landParcelAcres: undefined,
  totalTowers: undefined,
  floorsPerTower: '',
  totalUnits: undefined,
  availableUnits: undefined,
  litigation: false,
  litigationDetails: '',
  commencementCertificate: false,
  occupancyCertificate: false,
  legalNotes: '',
  brochureUrl: '',
  videos: [],
  paymentPlans: [],
  bankApprovals: [],
})
```

**Update `handleSubmit` body** — map ALL camelCase state fields to snake_case before sending:

```ts
const body = {
  ...project,
  builder_id: selectedBuilderId || null,
  // Spec fields
  tagline: project.tagline,
  possession_date: project.possessionDate,
  rera_possession_date: project.reraPossessionDate,
  land_parcel_acres: project.landParcelAcres,
  total_towers: project.totalTowers,
  floors_per_tower: project.floorsPerTower,
  total_units: project.totalUnits,
  available_units: project.availableUnits,
  construction_status: project.constructionStatus,
  construction_percent: project.constructionPercent,
  launch_date: project.launchDate,
  // RERA
  rera_id: project.reraId,
  rera_expiry: project.reraExpiry,
  rera_link: project.reraLink,
  // Legal
  litigation: project.litigation,
  litigation_details: project.litigationDetails,
  commencement_certificate: project.commencementCertificate,
  occupancy_certificate: project.occupancyCertificate,
  legal_notes: project.legalNotes,
  // Media
  brochure_url: project.brochureUrl,
  videos: project.videos,
  // Financial
  payment_plans: project.paymentPlans,
  bank_approvals: project.bankApprovals,
  // Existing mappings
  nearby_locations: project.nearbyLocations || [],
  internal_amenities: project.internalAmenities || [],
  external_amenities: project.externalAmenities || [],
  rera_registrations: project.reraRegistrations || [],
  master_plan_images: project.masterPlanImages || [],
  // Remove camelCase duplicates that would confuse the API:
  possessionDate: undefined,
  reraPossessionDate: undefined,
  landParcelAcres: undefined,
  totalTowers: undefined,
  floorsPerTower: undefined,
  totalUnits: undefined,
  availableUnits: undefined,
  constructionStatus: undefined,
  constructionPercent: undefined,
  launchDate: undefined,
  reraId: undefined,
  reraExpiry: undefined,
  reraLink: undefined,
  litigationDetails: undefined,
  commencementCertificate: undefined,
  occupancyCertificate: undefined,
  legalNotes: undefined,
  brochureUrl: undefined,
  paymentPlans: undefined,
  bankApprovals: undefined,
  nearbyLocations: undefined,
  internalAmenities: undefined,
  externalAmenities: undefined,
  reraRegistrations: undefined,
  masterPlanImages: undefined,
}
```

---

## TASK 4 — Fix UnitConfigForm: Add `available`/`total` Fields + Fix Type Enum

**File:** `components/admin/UnitConfigForm.tsx`

**Problem A:** No inputs for `available` (units available for sale) and `total` (total units of this config). The API requires them.

**Problem B:** Unit type is a free-text field but the API and DB enforce a strict enum. Reconcile: either make the `type` field a dropdown with a fixed list **plus** a separate free-text `label` field for display names, OR relax the API enum to `z.string()`. The recommended fix is to relax the API:

In `lib/project-schema.ts`, change:
```ts
// BEFORE
type: z.enum(['1BHK', '2BHK', '3BHK', '4BHK', 'Villa', 'Plot']),

// AFTER
type: z.string().min(1),
```

And update the DB `unit_configs` table to remove the type CHECK constraint (or make it a text column without a check):
```sql
-- supabase/migrations/20260605_unit_config_type_text.sql
ALTER TABLE unit_configs DROP CONSTRAINT IF EXISTS unit_configs_type_check;
```

**Add `available` and `total` inputs** to each unit config card in `UnitConfigForm.tsx`:
```tsx
<div className="grid grid-cols-2 gap-3">
  <div className="space-y-1">
    <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Total Units</label>
    <input
      type="number" min="0"
      value={unit.total || 0}
      onChange={(e) => updateUnit(unit.id, { total: Number(e.target.value) })}
      className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
    />
  </div>
  <div className="space-y-1">
    <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Available</label>
    <input
      type="number" min="0"
      value={unit.available || 0}
      onChange={(e) => updateUnit(unit.id, { available: Number(e.target.value) })}
      className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
    />
  </div>
</div>
```

Also add these to the `UnitConfig` type in `types/project.ts`:
```ts
total?: number
available?: number
```

**Update handleSubmit in ProjectForm** to map unit configs to snake_case before sending:
```ts
unitConfigs: (project.unitConfigs || []).map(u => ({
  id: u.id,
  type: u.type,
  area: u.area,
  price_min: u.priceMin,
  price_max: u.priceMax,
  floor_range: u.floor || '',
  facing: u.facing || [],
  highlights: u.highlights || [],
  total: u.total || 0,
  available: u.available || 0,
  parking: u.parking,
  floor_plan_url: u.floorPlan?.startsWith('http') ? u.floorPlan : undefined,
  maintenance_cost: u.maintenancePerMonth,
})),
```

---

## TASK 5 — Fix Floor Plan Upload: Use R2 Instead of Base64

**File:** `components/admin/UnitConfigForm.tsx`

**Problem:** Floor plan images are converted to base64 dataURL and stored directly in the DB row. This will exceed row size limits and is very slow.

**Fix:** Replace the `FileReader` base64 approach with an upload to R2 via the existing `/api/admin/upload` route.

Replace the `handleFloorPlanUpload` function:

```ts
const handleFloorPlanUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })
    if (!res.ok) throw new Error('Upload failed')
    const { url } = await res.json()
    updateUnit(id, { floorPlan: url })
  } catch (err) {
    console.error('Floor plan upload failed:', err)
    // Show a toast error if sonner is available
  }
}
```

Make this function `async` and handle the loading state (add a `uploadingId: string | null` state to show a spinner on the specific card while uploading).

---

## TASK 6 — Fix Edit Page: Add Dedicated GET by ID + Map Raw DB Rows

**File:** `app/admin/projects/[id]/edit/page.tsx`

**Problem:** The page calls `GET /api/admin/projects` which returns ALL raw DB rows, then does `Array.find()`. Raw rows use snake_case so the ProjectForm receives `possession_date` instead of `possessionDate`, meaning all fields pre-fill as `undefined`.

**Fix A — Add a GET handler** to `app/api/admin/projects/[id]/route.ts` (the file you created in Task 2):

```ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthenticated(request)) return unauth()

  const id = params.id
  const supabase = createAdminSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const { data, error } = await supabase
    .from('projects')
    .select('*, unit_configs(*)')
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ project: data })
}
```

**Fix B — Update the edit page** to use the new endpoint and map snake_case to camelCase:

```ts
useEffect(() => {
  const loadProject = async () => {
    try {
      const res = await fetch(`/api/admin/projects/${id}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Not found')
      const { project: raw } = await res.json()

      // Map snake_case DB row → camelCase Project type
      const mapped: Project = {
        id: raw.id,
        slug: raw.slug,
        name: raw.name,
        builderName: raw.builder_name || '',
        builderLogo: raw.builder_logo,
        builder_id: raw.builder_id,
        location: raw.location || '',
        city: raw.city || 'Pune',
        lat: Number(raw.lat) || 18.5204,
        lng: Number(raw.lng) || 73.8567,
        tagline: raw.tagline || '',
        description: raw.description || '',
        reraId: raw.rera_id || '',
        reraExpiry: raw.rera_expiry || '',
        reraLink: raw.rera_link || '',
        launchDate: raw.launch_date || '',
        possessionDate: raw.possession_date || '',
        reraPossessionDate: raw.rera_possession_date || '',
        landParcelAcres: raw.land_parcel_acres,
        totalTowers: raw.total_towers,
        floorsPerTower: raw.floors_per_tower || '',
        totalUnits: raw.total_units || 0,
        availableUnits: raw.available_units || 0,
        unitConfigs: (raw.unit_configs || []).map((u: any) => ({
          id: u.id,
          type: u.type,
          area: Number(u.area),
          priceMin: Number(u.price_min),
          priceMax: Number(u.price_max),
          pricePerSqFt: Number(u.price_per_sqft) || 0,
          floor: u.floor_range || '',
          facing: u.facing || [],
          floorPlan: u.floor_plan_url || '',
          highlights: u.highlights || [],
          maintenancePerMonth: u.maintenance_cost || 0,
          parking: u.parking,
          total: u.total || 0,
          available: u.available || 0,
        })),
        pros: raw.pros || [],
        cons: raw.cons || [],
        amenities: raw.amenities || [],
        internalAmenities: raw.internal_amenities || [],
        externalAmenities: raw.external_amenities || [],
        images: raw.images || [],
        masterPlanImages: raw.master_plan_images || [],
        reraRegistrations: raw.rera_registrations || [],
        nearbyLocations: raw.nearby_locations || [],
        constructionStatus: raw.construction_status || 'under_construction',
        constructionPercent: raw.construction_percent || 0,
        litigation: !!raw.litigation,
        litigationDetails: raw.litigation_details || '',
        commencementCertificate: !!raw.commencement_certificate,
        occupancyCertificate: !!raw.occupancy_certificate,
        legalNotes: raw.legal_notes || '',
        paymentPlans: raw.payment_plans || [],
        bankApprovals: raw.bank_approvals || [],
        videos: raw.videos || [],
        brochureUrl: raw.brochure_url || '',
        isPublished: !!raw.is_published,
      }
      setProject(mapped)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }
  loadProject()
}, [id])
```

---

## TASK 7 — Fix `adminUpdateProject` to Pass All Fields Through

**File:** `services/projects.ts`

**Problem:** `adminUpdateProject` spreads `projectData` but the spread includes camelCase keys sent by any old callers. Since Task 3 ensures the form sends snake_case, this should now work — but add explicit destructuring to guard against stray fields.

**Fix:** In `adminUpdateProject`, after destructuring `unitConfigs`, also remove any remaining camelCase fields that should not hit the DB:

```ts
export async function adminUpdateProject(id: string, projectData: Record<string, unknown>): Promise<void> {
  const supabase = createAdminSupabaseClient()
  if (!supabase) return

  const {
    unitConfigs,
    // Strip any camelCase fields that leak through
    builderName, builderLogo, builderYearsExperience, builderCompletedProjects,
    builderCities, builderTopProjects, builderDescription,
    reraId, reraExpiry, reraLink, launchDate, possessionDate, reraPossessionDate,
    landParcelAcres, totalTowers, floorsPerTower, totalUnits, availableUnits,
    constructionStatus, constructionPercent,
    litigationDetails, commencementCertificate, occupancyCertificate, legalNotes,
    brochureUrl, paymentPlans, bankApprovals,
    nearbyLocations, internalAmenities, externalAmenities, reraRegistrations, masterPlanImages,
    ...project
  } = projectData as any

  await supabase.from('projects').update(project).eq('id', id)

  if (unitConfigs !== undefined) {
    await supabase.from('unit_configs').delete().eq('project_id', id)
    if (unitConfigs.length) {
      await supabase.from('unit_configs').insert(
        unitConfigs.map((unit: any) => ({ ...unit, project_id: id }))
      )
    }
  }
}
```

---

## TASK 8 — Fix `construction_status` Enum in `types/project.ts`

**File:** `types/project.ts`

No change needed — `new_launch` is already in the type. The DB and API are now fixed in Tasks 1 and 2. Just verify:

```ts
constructionStatus: 'pre_launch' | 'new_launch' | 'under_construction' | 'ready_to_move'
```

**Also add missing fields** to the `UnitConfig` interface:
```ts
export interface UnitConfig {
  // existing fields...
  total?: number
  available?: number
}
```

---

## TASK 9 — Add Construction Status Dropdown to the Form

**File:** `components/admin/ProjectForm.tsx`

The `constructionStatus` field is in state but has no UI. Add a `<select>` dropdown in the new Project Specs section (Task 3):

```tsx
<div className="space-y-2">
  <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">
    Construction Status
  </label>
  <select
    value={project.constructionStatus || 'under_construction'}
    onChange={(e) => setProject({ ...project, constructionStatus: e.target.value as any })}
    className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm"
  >
    <option value="pre_launch">Pre-Launch</option>
    <option value="new_launch">New Launch</option>
    <option value="under_construction">Under Construction</option>
    <option value="ready_to_move">Ready to Move</option>
  </select>
</div>
```

---

## TASK 10 — Fix Settings Page: Wire Up Real Functionality

**File:** `app/admin/settings/page.tsx`

**Problem:** All 5 settings cards are pure decoration — no links, no modals, no functionality.

**Minimum viable fix:**

1. **Lead Notifications card** — add a simple form modal or inline expansion to configure the notification email address. Save to Supabase `settings` table (create it if it doesn't exist):

```sql
-- supabase/migrations/20260605_settings_table.sql
CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON admin_settings USING (true) WITH CHECK (true);
```

2. **Access Control card** — link to `/admin/users` (already exists).

3. **Other cards** — replace the "Configure" badge with a `Coming Soon` badge to communicate their status honestly, rather than implying they are clickable.

---

## ✅ To-Do Checklist

```
TASK 1 — DB Schema
[ ] Create supabase/migrations/20260605_missing_project_columns.sql
[ ] Run migration against Supabase
[ ] Verify projects_public view creates without error

TASK 2 — API Route
[ ] Create lib/project-schema.ts and move projectSchema + unitConfigSchema there
[ ] Update app/api/admin/projects/route.ts to import from lib/project-schema.ts
[ ] Add all missing fields to projectSchema
[ ] Fix construction_status enum to include new_launch
[ ] Create app/api/admin/projects/[id]/route.ts with GET, PATCH, DELETE handlers

TASK 3 — Admin Form Missing Fields
[ ] Add "Project Specs & Dates" section with all inputs
[ ] Add "Legal & Compliance" section
[ ] Add "Media & Documents" section (Brochure URL + Videos)
[ ] Add "Payment Plans & Bank Approvals" section
[ ] Update initial state with all new fields
[ ] Fix handleSubmit to send snake_case body with all fields mapped

TASK 4 — UnitConfigForm
[ ] Add total / available inputs to each unit config card
[ ] Add total / available to UnitConfig type in types/project.ts
[ ] Change API unitConfigSchema type to z.string().min(1)
[ ] Create migration to drop unit_configs type CHECK constraint
[ ] Update ProjectForm handleSubmit to snake_case map unitConfigs

TASK 5 — Floor Plan Upload
[ ] Replace base64 FileReader with fetch to /api/admin/upload
[ ] Add uploadingId state for loading indicator per card

TASK 6 — Edit Page
[ ] Add GET handler to app/api/admin/projects/[id]/route.ts
[ ] Update edit page to fetch from /api/admin/projects/${id}
[ ] Add full snake_case → camelCase mapping in edit page useEffect

TASK 7 — adminUpdateProject
[ ] Strip camelCase keys before DB update in services/projects.ts

TASK 8 — Types
[ ] Confirm new_launch in constructionStatus union (already there)
[ ] Add total and available to UnitConfig interface

TASK 9 — Construction Status Dropdown
[ ] Add <select> dropdown for constructionStatus to the form

TASK 10 — Settings Page
[ ] Create admin_settings table migration
[ ] Wire Lead Notifications card to save notification email
[ ] Wire Access Control card to /admin/users
[ ] Mark other cards as Coming Soon
```

---

## Notes for Cursor

- After Task 2, test by creating a new project — watch the Network tab to confirm the POST body includes `land_parcel_acres`, `possession_date`, etc. and that Zod does not reject them.
- After Task 3 + Task 6, test edit by opening an existing project — all fields should pre-fill correctly.
- After Task 5, upload a floor plan and confirm the value saved is an HTTPS URL, not a long base64 string.
- The `lib/r2.ts` and `/api/admin/upload/route.ts` already exist — do not recreate them, just call the upload endpoint.
- Do not modify `lib/mock-data.ts` — it is a fallback for dev environments without Supabase.