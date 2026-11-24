import type { TodayResponse } from '@habit-tracker/shared'

import type { TodayRepository } from './today.repository.js'
import { toHabit } from '../habits/habits.mapper.js'
import type { UsersService } from '../users/users.service.js'

type Deps = { today: TodayRepository; users: UsersService }

export function createTodayService({ today, users }: Deps) {
  return {
    async forUser(userId: string): Promise<TodayResponse> {
      const date = await users.todayFor(userId)
      const rows = await today.findItems(userId, date)
      return {
        date,
        items: rows.map((row) => ({
          habit: toHabit(row.habit),
          checked: row.checkId !== null,
        })),
      }
    },
  }
}

export type TodayService = ReturnType<typeof createTodayService>
