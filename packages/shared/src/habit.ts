import { z } from 'zod'

export const HabitSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(100),
  description: z.string().max(500).nullable(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  archivedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
})

export type Habit = z.infer<typeof HabitSchema>
