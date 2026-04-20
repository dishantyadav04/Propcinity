import { NextRequest, NextResponse } from 'next/server'
import { generateFileKey, uploadToR2 } from '@/lib/r2'
import { isAdminAuthenticated } from '@/lib/admin-auth'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024

export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData().catch(() => null)
  const file = formData?.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPG, PNG, WebP allowed' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Max 5MB per image' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const key = generateFileKey(file.name)
  const url = await uploadToR2(buffer, key, file.type)

  return NextResponse.json({ url })
}
