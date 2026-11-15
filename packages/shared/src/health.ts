import { z } from 'zod'

export const HealthSchema = z.object({
  api: z.literal('ok'),
  db: z.enum(['ok', 'error']),
})

export type Health = z.infer<typeof HealthSchema>
