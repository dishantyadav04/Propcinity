import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET = process.env.R2_BUCKET_NAME

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Error: Supabase environment variables are missing.")
  process.exit(1)
}

if (!CLOUDFLARE_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
  console.error("Error: Cloudflare R2 environment variables are missing.")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

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

async function run() {
  console.log("Fetching projects and unit configs from Supabase...")
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('images, master_plan_images, floor_plan_images, brochure_url')

  if (projectsError) {
    console.error("Failed to fetch projects:", projectsError.message)
    process.exit(1)
  }

  const { data: unitConfigs, error: unitsError } = await supabase
    .from('unit_configs')
    .select('images, floor_plan')

  if (unitsError) {
    console.error("Failed to fetch unit configs:", unitsError.message)
    process.exit(1)
  }

  const dbKeys = new Set<string>()
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

  console.log(`Found ${dbKeys.size} referenced files in DB.`)
  console.log("Listing objects under 'projects/' from R2...")

  let r2Keys: string[] = []
  try {
    r2Keys = await listR2Objects('projects/')
  } catch (err: any) {
    console.error("Failed to list R2 objects:", err.message)
    process.exit(1)
  }

  const orphans = r2Keys.filter(key => !dbKeys.has(key))
  console.log(`Found ${orphans.length} orphaned objects.`)

  if (orphans.length === 0) {
    console.log("No orphans to clean up.")
    return
  }

  console.log(`Starting cleanup of ${orphans.length} orphaned files...`)

  for (const key of orphans) {
    try {
      console.log(`Deleting from R2: ${key}`)
      await r2Client.send(
        new DeleteObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
        })
      )
      console.log(`Successfully deleted ${key}`)
    } catch (error: any) {
      console.error(`Failed to delete ${key}:`, error.message)
    }
  }

  console.log("Cleanup completed.")
}

run().catch(console.error)
