// lib/booking-ref.ts
// Centralised booking reference generator — cryptographically random

export function generateBookingRef(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const randomBytes = crypto.getRandomValues(new Uint8Array(8))
  const randomPart = Array.from(randomBytes)
    .map(b => chars[b % chars.length])
    .join('')
  return `REF-${randomPart}`
}
