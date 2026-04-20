import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim()
}

export function formatIndianPrice(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
  return `₹${amount.toLocaleString('en-IN')}`
}

export function getPriceLabel(project: {
  unitConfigs: { priceMin: number; priceMax: number }[]
}): string {
  if (!project.unitConfigs.length) return 'Price on request'

  const allMins = project.unitConfigs.map((unit) => unit.priceMin)
  const allMaxs = project.unitConfigs.map((unit) => unit.priceMax)
  const min = Math.min(...allMins)
  const max = Math.max(...allMaxs)

  return `${formatIndianPrice(min)}-${formatIndianPrice(max)}`
}
