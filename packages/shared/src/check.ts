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
