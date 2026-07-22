import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export const R2_BUCKET = process.env.R2_BUCKET_NAME!
export const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!

export function getPublicUrl(key: string): string {
  if (!R2_PUBLIC_URL) {
    throw new Error('NEXT_PUBLIC_R2_PUBLIC_URL is not set. Images cannot be served.')
  }
  return `${R2_PUBLIC_URL}/${key}`
}

export function generateFileKey(originalName: string, extOverride?: string): string {
  const ext = extOverride || originalName.split('.').pop()?.toLowerCase() || 'jpg'
  const uuid = crypto.randomUUID()
  const sanitized = originalName
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .slice(0, 40)

  return `projects/${uuid}-${sanitized}.${ext}`
}

export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  )

  return getPublicUrl(key)
}

import * as Sentry from '@sentry/nextjs'

export interface DeleteResult {
  success: boolean
  key: string
  error?: any
}

export async function deleteFromR2(key: string): Promise<DeleteResult> {
  let fileKey = key
  if (key.startsWith('http://') || key.startsWith('https://')) {
    try {
      const urlObj = new URL(key)
      const pathname = urlObj.pathname.startsWith('/')
        ? urlObj.pathname.substring(1)
        : urlObj.pathname
      fileKey = decodeURIComponent(pathname)
    } catch (e) {
      if (R2_PUBLIC_URL) {
        fileKey = key.replace(`${R2_PUBLIC_URL}/`, '')
      }
    }
  }

  try {
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: fileKey,
      })
    )
    return { success: true, key }
  } catch (error) {
    return { success: false, key, error }
  }
}

/**
 * Given old and new URL arrays, delete any URLs that were removed.
 * Filters to only R2-hosted URLs (starts with http) before diffing.
 * Safe to call even when arrays are empty or undefined.
 */
export async function cleanupRemovedR2Files(
  oldUrls: (string | null | undefined)[],
  newUrls: (string | null | undefined)[]
): Promise<void> {
  const isR2Url = (u: string | null | undefined): u is string =>
    typeof u === 'string' && u.startsWith('http')

  const oldSet = new Set(oldUrls.filter(isR2Url))
  const newSet = new Set(newUrls.filter(isR2Url))

  const toDelete = [...oldSet].filter((url) => !newSet.has(url))
  if (!toDelete.length) return

  const results = await Promise.allSettled(toDelete.map((url) => deleteFromR2(url)))
  let successCount = 0

  results.forEach((result, idx) => {
    const url = toDelete[idx]
    if (result.status === 'rejected') {
      console.error(`[cleanupRemovedR2Files] Failed to delete ${url}:`, result.reason)
      Sentry.captureException(new Error(`Failed to delete R2 URL: ${url}. Promise rejected.`), {
        extra: { url, reason: result.reason, context: 'cleanupRemovedR2Files' }
      })
    } else {
      const deleteResult = result.value
      if (deleteResult.success) {
        successCount++
      } else {
        console.error(`[cleanupRemovedR2Files] Failed to delete ${url} (R2 error):`, deleteResult.error)
        Sentry.captureException(new Error(`Failed to delete R2 URL: ${url}. R2 error.`), {
          extra: { url, error: deleteResult.error, context: 'cleanupRemovedR2Files' }
        })
      }
    }
  })

  console.info(`[cleanupRemovedR2Files] R2 cleanup: ${successCount}/${toDelete.length} deleted`)
}
