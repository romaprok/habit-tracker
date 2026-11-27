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

export const HEATMAP_DAYS = 365

export const HeatmapDaySchema = z.object({
  date: z.iso.date(),
  checked: z.boolean(),
})

export type HeatmapDay = z.infer<typeof HeatmapDaySchema>

export const HabitStatsSchema = z.object({
  habitId: z.uuid(),
  from: z.iso.date(),
  to: z.iso.date(),
  // Every day from `from` to `to`, oldest first, gaps included.
  days: z.array(HeatmapDaySchema),
  streak: StreakSchema.omit({ habitId: true }),
})

export type HabitStats = z.infer<typeof HabitStatsSchema>

export const HabitStatsResponseSchema = z.object({ stats: HabitStatsSchema })

export type HabitStatsResponse = z.infer<typeof HabitStatsResponseSchema>
