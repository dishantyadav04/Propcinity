import { NextRequest, NextResponse } from 'next/server'
import { ListObjectsV2Command } from '@aws-sdk/client-s3'
import { r2Client, R2_BUCKET } from '@/lib/r2'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { DEBUG_ROUTES_ENABLED } from '@/lib/debug-routes'

async function listR2Objects(prefix: string): Promise<string[]> {
  const keys: string[] = []
  let continuationToken: string | undefined

  do {
    const command: ListObjectsV2Command = new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    })

    const response = await r2Client.send(command)
    if (response.Contents) {
      for (const obj of response.Contents) {
        if (obj.Key) {
          keys.push(obj.Key)
        }
      }
    }
    continuationToken = response.NextContinuationToken
  } while (continuationToken)

  return keys
}

function extractKeyFromUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname.startsWith('/') 
        ? urlObj.pathname.substring(1) 
        : urlObj.pathname
      return decodeURIComponent(pathname)
    } catch {
      return url
    }
  }
  return url
}

export async function GET(request: NextRequest) {
  if (!DEBUG_ROUTES_ENABLED) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (!await isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminSupabaseClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  // Fetch all projects
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('images, master_plan_images, floor_plan_images, brochure_url')
  
  if (projectsError) {
    return NextResponse.json({ error: projectsError.message }, { status: 500 })
  }

  // Fetch all unit configs
  const { data: unitConfigs, error: unitsError } = await supabase
    .from('unit_configs')
    .select('images, floor_plan')

  if (unitsError) {
    return NextResponse.json({ error: unitsError.message }, { status: 500 })
  }

  const dbKeys = new Set<string>()

  // Helper to add if it looks like a valid key
  const addUrl = (url: string | null | undefined) => {
    if (!url) return
    const key = extractKeyFromUrl(url)
    if (key.startsWith('projects/')) {
      dbKeys.add(key)
    }
  }

  projects?.forEach(p => {
    p.images?.forEach(addUrl)
    p.master_plan_images?.forEach(addUrl)
    p.floor_plan_images?.forEach(addUrl)
    addUrl(p.brochure_url)
  })

  unitConfigs?.forEach(u => {
    u.images?.forEach(addUrl)
    addUrl(u.floor_plan)
  })

  let r2Keys: string[] = []
  try {
    r2Keys = await listR2Objects('projects/')
  } catch (err: any) {
    return NextResponse.json({ error: `Failed to list R2 objects: ${err.message}` }, { status: 500 })
  }

  const orphans = r2Keys.filter(key => !dbKeys.has(key))

  return NextResponse.json({
    totalR2Objects: r2Keys.length,
    totalReferencedObjects: dbKeys.size,
    orphanCount: orphans.length,
    orphans,
  })
}
