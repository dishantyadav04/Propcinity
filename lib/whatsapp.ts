export function generateConsultationConfirmation(data: {
  name: string
  projectName: string
  date: string
  time: string
}): string {
  return `Hi ${data.name}! Your consultation for ${data.projectName} is confirmed for ${data.date} at ${data.time}. Our advisor will call shortly. - PropIQ`
}

export function generateGeneralInquiry(data: {
  projectName: string
  price: string
}): string {
  return `Hi! I'm interested in ${data.projectName} (${data.price}) on PropIQ. Can you share more details?`
}

export function generateCompareInquiry(data: {
  projectA: string
  projectB: string
}): string {
  return `Hi! I'm comparing ${data.projectA} and ${data.projectB} on PropIQ. Can your advisor help me decide?`
}
