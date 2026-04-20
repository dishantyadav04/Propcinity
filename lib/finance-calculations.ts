export function calculateEMI(
  principal: number,
  annualRatePercent: number,
  tenureMonths: number
): number {
  if (principal <= 0 || annualRatePercent <= 0 || tenureMonths <= 0) return 0

  const r = annualRatePercent / 12 / 100
  const emi = (principal * r * Math.pow(1 + r, tenureMonths)) /
    (Math.pow(1 + r, tenureMonths) - 1)

  return Math.round(emi)
}

export function calculateTotalInterest(
  principal: number,
  annualRatePercent: number,
  tenureMonths: number
): number {
  const emi = calculateEMI(principal, annualRatePercent, tenureMonths)
  return Math.round(emi * tenureMonths - principal)
}

export function calculateDownPayment(
  propertyPrice: number,
  ltvPercent = 80
): number {
  return Math.round(propertyPrice * (1 - ltvPercent / 100))
}

export function formatINR(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
  return `₹${amount.toLocaleString('en-IN')}`
}
