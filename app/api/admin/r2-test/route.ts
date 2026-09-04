import { NextRequest, NextResponse } from 'next/server'
import { HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { r2Client, R2_BUCKET, getPublicUrl } from '@/lib/r2'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { adminCreateProject, adminDeleteProject } from '@/services/projects'
import { DEBUG_ROUTES_ENABLED } from '@/lib/debug-routes'

async function uploadMockFile(key: string): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: Buffer.from(`mock image content for ${key}`),
      ContentType: 'image/jpeg',
    })
  )
  return getPublicUrl(key)
}

async function fileExistsInR2(key: string): Promise<boolean> {
  try {
    await r2Client.send(
      new HeadObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
      })
    )
    return true
  } catch (err: any) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return false
    }
    throw err
  }
}

export async function GET(request: NextRequest) {
  if (!DEBUG_ROUTES_ENABLED) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const isDevBypass = process.env.NODE_ENV !== 'production' && request.nextUrl.searchParams.get('bypass') === 'true'
  if (!isDevBypass && !await isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminSupabaseClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const testId = crypto.randomUUID()
  const keys = {
    gallery: `projects/test-gallery-${testId}.jpg`,
    masterPlan: `projects/test-masterplan-${testId}.jpg`,
    floorPlan: `projects/test-floorplan-${testId}.jpg`,
    brochure: `projects/test-brochure-${testId}.jpg`,
    unitImage: `projects/test-unitimage-${testId}.jpg`,
    unitFloorPlan: `projects/test-unitfloorplan-${testId}.jpg`,
  }

  const log: string[] = []

  try {
    // 1. Upload mock files
    log.push("Uploading mock files to R2...")
    const galleryUrl = await uploadMockFile(keys.gallery)
    const masterPlanUrl = await uploadMockFile(keys.masterPlan)
    const floorPlanUrl = await uploadMockFile(keys.floorPlan)
    const brochureUrl = await uploadMockFile(keys.brochure)
    const unitImageUrl = await uploadMockFile(keys.unitImage)
    const unitFloorPlanUrl = await uploadMockFile(keys.unitFloorPlan)
    log.push("Mock files uploaded successfully.")

    // 2. Create project payload
    const projectData = {
      name: `R2 Integration Test ${testId}`,
      slug: `r2-integration-test-${testId}`,
      images: [galleryUrl],
      master_plan_images: [masterPlanUrl],
      floor_plan_images: [floorPlanUrl],
      brochure_url: brochureUrl,
      unitConfigs: [
        {
          type: "Test Unit 2 BHK",
          area: 1200,
          price: 9000000,
          price_is_plus: false,
          facing: ["East"],
          images: [unitImageUrl],
          floor_plan: unitFloorPlanUrl,
        }
      ]
    }

    // 3. Create project in DB
    log.push("Creating project in database...")
    const projectId = await adminCreateProject(projectData)
    log.push(`Project created with ID: ${projectId}`)

    // 4. Verify DB entry
    const { data: dbProj, error: dbErr } = await supabase
      .from('projects')
      .select('id, name, unit_configs(id)')
      .eq('id', projectId)
      .single()

    if (dbErr || !dbProj) {
      throw new Error(`Failed to find created project in DB: ${dbErr?.message}`)
    }
    log.push("Project verified in database successfully.")

    // 5. Delete project (triggers background R2 cleanup)
    log.push("Deleting project from database...")
    await adminDeleteProject(projectId)
    log.push("Project deletion triggered.")

    // 6. Wait for background cleanup
    log.push("Waiting 1.5 seconds for R2 background cleanup to finish...")
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // 7. Verify all R2 objects are deleted
    log.push("Verifying R2 cleanup...")
    const results = {
      galleryDeleted: !(await fileExistsInR2(keys.gallery)),
      masterPlanDeleted: !(await fileExistsInR2(keys.masterPlan)),
      floorPlanDeleted: !(await fileExistsInR2(keys.floorPlan)),
      brochureDeleted: !(await fileExistsInR2(keys.brochure)),
      unitImageDeleted: !(await fileExistsInR2(keys.unitImage)),
      unitFloorPlanDeleted: !(await fileExistsInR2(keys.unitFloorPlan)),
    }

    const allSuccessful = Object.values(results).every(v => v === true)
    log.push(`R2 verification complete. All deleted: ${allSuccessful}`)

    return NextResponse.json({
      success: allSuccessful,
      projectId,
      results,
      log,
    })
  } catch (err: any) {
    log.push(`Test failed with error: ${err.message}`)
    return NextResponse.json({
      success: false,
      error: err.message,
      log,
    }, { status: 500 })
  }
}
