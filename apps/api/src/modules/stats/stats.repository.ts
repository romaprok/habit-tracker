import type { HeatmapDay, Streak } from '@habit-tracker/shared'

import { completionQuery, heatmapQuery, streaksQuery } from './stats.queries.js'
import type { Db } from '../../db/client.js'

type CompletionRow = {
  weekChecked: number
  weekTotal: number
  monthChecked: number
  monthTotal: number
}

export function createStatsRepository(db: Db) {
  return {
    async streaks(
      userId: string,
      today: string,
      habitId?: string,
    ): Promise<Streak[]> {
      const { rows } = await db.execute<Streak>(
        streaksQuery(userId, today, habitId),
      )
      return rows
    },

    async heatmap(
      habitId: string,
      from: string,
      to: string,
    ): Promise<HeatmapDay[]> {
      const { rows } = await db.execute<HeatmapDay>(
        heatmapQuery(habitId, from, to),
      )
      return rows
    },

    async completion(habitId: string, today: string): Promise<CompletionRow> {
      const { rows } = await db.execute<CompletionRow>(
        completionQuery(habitId, today),
      )
      return rows[0]
    },
  }
}

export type StatsRepository = ReturnType<typeof createStatsRepository>
