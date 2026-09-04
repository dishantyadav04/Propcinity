import { z } from 'zod'
import { builderSchema } from '@/lib/builder-schema'

export type Builder = z.infer<typeof builderSchema> & {
  id: string
}
