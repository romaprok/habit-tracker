import { z } from 'zod'

export const StreakSchema = z.object({
  habitId: z.uuid(),
  // Days in a row up to today, or up to yesterday while today is not checked yet.
  current: z.number().int().nonnegative(),
  longest: z.number().int().nonnegative(),
})

export type Streak = z.infer<typeof StreakSchema>

export const StreakListResponseSchema = z.object({
  date: z.iso.date(),
  streaks: z.array(StreakSchema),
})

export type StreakListResponse = z.infer<typeof StreakListResponseSchema>
