import { z } from 'zod'

import { HabitSchema } from './habit.js'

export const CheckSchema = z.object({
  habitId: z.uuid(),
  date: z.iso.date(),
})

export type Check = z.infer<typeof CheckSchema>

export const CheckListResponseSchema = z.object({
  checks: z.array(CheckSchema),
})

export type CheckListResponse = z.infer<typeof CheckListResponseSchema>

export const TodayItemSchema = z.object({
  habit: HabitSchema,
  checked: z.boolean(),
})

export type TodayItem = z.infer<typeof TodayItemSchema>

export const TodayResponseSchema = z.object({
  date: z.iso.date(),
  items: z.array(TodayItemSchema),
})

export type TodayResponse = z.infer<typeof TodayResponseSchema>

export const MAX_CHECKS_RANGE_DAYS = 366

const DAY_MS = 24 * 60 * 60 * 1000

export const ChecksQuerySchema = z
  .object({ from: z.iso.date(), to: z.iso.date() })
  .refine((q) => q.from <= q.to, {
    message: '`from` must not be after `to`',
    path: ['to'],
  })
  .refine(
    (q) =>
      (Date.parse(q.to) - Date.parse(q.from)) / DAY_MS < MAX_CHECKS_RANGE_DAYS,
    {
      message: `The range must be shorter than ${MAX_CHECKS_RANGE_DAYS} days`,
      path: ['to'],
    },
  )

export type ChecksQuery = z.infer<typeof ChecksQuerySchema>
