import { NextRequest, NextResponse } from 'next/server'
import { generateFileKey, uploadToR2 } from '@/lib/r2'
import { isAdminAuthenticated } from '@/lib/admin-auth'

const MAX_SIZE = 5 * 1024 * 1024

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export async function POST(request: NextRequest) {
  if (!await isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData().catch(() => null)
  const file = formData?.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Max 5MB per image' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  const isJPEG = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF
  const isPNG  = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47
  const isWebP = buffer.length > 12 && buffer.slice(8, 12).toString('ascii') === 'WEBP'

  if (!isJPEG && !isPNG && !isWebP) {
    return NextResponse.json({ error: 'Only JPG, PNG, WebP images allowed' }, { status: 400 })
  }

  const contentType = isJPEG ? 'image/jpeg' : isPNG ? 'image/png' : 'image/webp'
  const safeExt = MIME_TO_EXT[contentType]
  if (!safeExt) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
  }

  const key = generateFileKey(file.name, safeExt)
  const url = await uploadToR2(buffer, key, contentType)

  return NextResponse.json({ url })
}
