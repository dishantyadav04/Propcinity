import { z } from 'zod'

export const builderSchema = z.object({
  name: z.string().min(1),
  website: z.string().optional().nullable(),
  established_year: z.string().optional().nullable(),
  headquartered: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  years_in_business: z.coerce.number().int().optional().nullable(),
  total_projects_delivered: z.coerce.number().int().optional().nullable(),
  on_time_delivery_percent: z.coerce.number().optional().nullable(),
  avg_delay_months: z.coerce.number().optional().nullable(),
  legal_cases: z.coerce.number().int().optional().nullable(),
  customer_complaints: z.coerce.number().int().optional().nullable(),
  refund_disputes: z.coerce.number().int().optional().nullable(),
  logo_url: z.string().optional().nullable(),
  builder_score: z.number().int().min(0).max(100).optional(),
  score_breakdown: z.record(z.number()).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})
