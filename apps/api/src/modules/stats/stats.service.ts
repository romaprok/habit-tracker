import {
  HEATMAP_DAYS,
  type Completion,
  type HabitStats,
  type StreakListResponse,
} from '@habit-tracker/shared'

import type { StatsRepository } from './stats.repository.js'
import { NotFoundError } from '../../errors/app-error.js'
import { addDays } from '../../lib/dates.js'
import type { HabitsRepository } from '../habits/habits.repository.js'
import type { UsersService } from '../users/users.service.js'

function completion(checked: number, total: number): Completion {
  return { checked, total, rate: total > 0 ? checked / total : 0 }
}

type Deps = {
  stats: StatsRepository
  habits: HabitsRepository
  users: UsersService
}

export function createStatsService({ stats, habits, users }: Deps) {
  return {
    async streaks(userId: string): Promise<StreakListResponse> {
      // "Today" is the user's today: a streak is alive until their midnight.
      const date = await users.todayFor(userId)
      return { date, streaks: await stats.streaks(userId, date) }
    },

    async forHabit(userId: string, habitId: string): Promise<HabitStats> {
      // Same 404 for "not yours" and "does not exist", as everywhere.
      const habit = await habits.findOwned(habitId, userId)
      if (!habit) throw new NotFoundError('Habit not found')

      const to = await users.todayFor(userId)
      const from = addDays(to, -(HEATMAP_DAYS - 1))
      const [days, [streak], done] = await Promise.all([
        stats.heatmap(habitId, from, to),
        stats.streaks(userId, to, habitId),
        stats.completion(habitId, to),
      ])
      return {
        habitId,
        from,
        to,
        days,
        streak: { current: streak.current, longest: streak.longest },
        completion: {
          week: completion(done.weekChecked, done.weekTotal),
          month: completion(done.monthChecked, done.monthTotal),
        },
      }
    },
  }
}

export type StatsService = ReturnType<typeof createStatsService>
