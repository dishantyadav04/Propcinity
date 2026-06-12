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

export async function deleteFromR2(key: string): Promise<void> {
  const fileKey = key.startsWith('http')
    ? key.replace(`${R2_PUBLIC_URL}/`, '')
    : key

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: fileKey,
    })
  )
}
