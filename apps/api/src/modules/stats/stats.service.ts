import type { StreakListResponse } from '@habit-tracker/shared'

import type { StatsRepository } from './stats.repository.js'
import type { UsersService } from '../users/users.service.js'

type Deps = { stats: StatsRepository; users: UsersService }

export function createStatsService({ stats, users }: Deps) {
  return {
    async streaks(userId: string): Promise<StreakListResponse> {
      // "Today" is the user's today: a streak is alive until their midnight.
      const date = await users.todayFor(userId)
      return { date, streaks: await stats.streaks(userId, date) }
    },
  }
}

export type StatsService = ReturnType<typeof createStatsService>
