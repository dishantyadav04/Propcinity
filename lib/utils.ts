import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

import { storage, STORAGE_KEYS } from './storage'

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

export function formatIndianPrice(amount: number, decimals: 0 | 1 | 2 = 1): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(decimals)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(decimals)} L`
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

  return `${formatIndianPrice(min, 0)}-${formatIndianPrice(max, 0)}`
}

export function addToCompare(project: any): boolean {
  const current = storage.get<any[]>(STORAGE_KEYS.COMPARE_ITEMS, []);
  const exists = current.find((p: any) => p.id === project.id);
  if (exists) {
    const updated = current.filter((p: any) => p.id !== project.id);
    storage.set(STORAGE_KEYS.COMPARE_ITEMS, updated);
    window.dispatchEvent(new Event('compareUpdated'));
    return false; // removed
  }
  if (current.length >= 5) return false; // max reached
  const updated = [...current, project];
  storage.set(STORAGE_KEYS.COMPARE_ITEMS, updated);
  window.dispatchEvent(new Event('compareUpdated'));
  return true; // added
}
