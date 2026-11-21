import { z } from 'zod'

export const HabitSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(100),
  description: z.string().max(500).nullable(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  archivedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
})

export const HabitListResponseSchema = z.object({
  habits: z.array(HabitSchema),
})

export type HabitListResponse = z.infer<typeof HabitListResponseSchema>

export const HabitResponseSchema = z.object({
  habit: HabitSchema,
})

export type HabitResponse = z.infer<typeof HabitResponseSchema>
export type Habit = z.infer<typeof HabitSchema>

export const CreateHabitSchema = HabitSchema.pick({
  name: true,
  description: true,
  color: true,
}).partial({ description: true })

export type CreateHabit = z.infer<typeof CreateHabitSchema>

export const UpdateHabitSchema = CreateHabitSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' },
)

export type UpdateHabit = z.infer<typeof UpdateHabitSchema>
