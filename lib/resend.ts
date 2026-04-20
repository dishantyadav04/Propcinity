import { Resend } from 'resend'

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  return new Resend(apiKey)
}

export async function sendBuyerConfirmation(data: {
  name: string
  email?: string
  phone: string
  projectName: string
  preferredDate: string
  preferredTime: string
  bookingRef: string
}): Promise<void> {
  if (!data.email) return

  await getResendClient().emails.send({
    from: 'PropIQ <hello@propiq.in>',
    to: data.email,
    subject: `Consultation Confirmed - ${data.projectName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2>Hi ${data.name},</h2>
        <p>Your consultation is confirmed.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <tr><td style="padding:8px;color:#666;">Project</td><td style="padding:8px;"><strong>${data.projectName}</strong></td></tr>
          <tr><td style="padding:8px;color:#666;">Date</td><td style="padding:8px;">${data.preferredDate}</td></tr>
          <tr><td style="padding:8px;color:#666;">Time</td><td style="padding:8px;">${data.preferredTime}</td></tr>
          <tr><td style="padding:8px;color:#666;">Reference</td><td style="padding:8px;">${data.bookingRef}</td></tr>
        </table>
        <p>Our advisor will call you within 2 hours to confirm.</p>
        <p style="color:#666;font-size:13px;">No builder contact. No spam. 100% free for buyers.</p>
        <p>- PropIQ Team</p>
      </div>
    `,
  })
}

export async function sendOpsAlert(data: {
  name: string
  phone: string
  projectName: string
  intentLabel: 'hot' | 'warm' | 'cold'
  intentScore: number
  timeline: string
  budgetReady: string
  financeType: string
  decisionMaker: string
  preferredDate?: string
  preferredTime?: string
  familyJoining?: boolean
  bookingRef: string
}): Promise<void> {
  const colors = { hot: '#EF4444', warm: '#F59E0B', cold: '#94A3B8' }
  const color = colors[data.intentLabel]
  const urgency = data.intentLabel === 'hot'
    ? '<p style="color:#EF4444;font-weight:bold;font-size:18px;">CALL WITHIN 2 HOURS</p>'
    : ''

  await getResendClient().emails.send({
    from: 'PropIQ Leads <leads@propiq.in>',
    to: process.env.OPS_EMAIL!,
    subject: `[${data.intentLabel.toUpperCase()}] New Lead - ${data.name} - ${data.projectName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        ${urgency}
        <div style="background:${color}22;border:2px solid ${color};border-radius:8px;padding:16px;margin-bottom:20px;">
          <span style="color:${color};font-weight:bold;font-size:20px;">
            ${data.intentLabel.toUpperCase()} - Score: ${data.intentScore}/100
          </span>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px;color:#666;">Name</td><td style="padding:8px;"><strong>${data.name}</strong></td></tr>
          <tr><td style="padding:8px;color:#666;">Phone</td><td style="padding:8px;"><strong>${data.phone}</strong></td></tr>
          <tr><td style="padding:8px;color:#666;">Project</td><td style="padding:8px;">${data.projectName}</td></tr>
          <tr><td style="padding:8px;color:#666;">Timeline</td><td style="padding:8px;">${data.timeline}</td></tr>
          <tr><td style="padding:8px;color:#666;">Budget</td><td style="padding:8px;">${data.budgetReady}</td></tr>
          <tr><td style="padding:8px;color:#666;">Finance</td><td style="padding:8px;">${data.financeType}</td></tr>
          <tr><td style="padding:8px;color:#666;">Decision Maker</td><td style="padding:8px;">${data.decisionMaker}</td></tr>
          <tr><td style="padding:8px;color:#666;">Date</td><td style="padding:8px;">${data.preferredDate || 'Not set'}</td></tr>
          <tr><td style="padding:8px;color:#666;">Time</td><td style="padding:8px;">${data.preferredTime || 'Not set'}</td></tr>
          <tr><td style="padding:8px;color:#666;">Family Joining</td><td style="padding:8px;">${data.familyJoining ? 'Yes' : 'No'}</td></tr>
          <tr><td style="padding:8px;color:#666;">Ref</td><td style="padding:8px;">${data.bookingRef}</td></tr>
        </table>
      </div>
    `,
  })
}
