import { useQuery } from '@tanstack/react-query'

import { HabitStatsResponseSchema } from '@habit-tracker/shared'

import { statsKeys } from './stats-keys.ts'
import { api } from '../../lib/api-client.ts'

export function useHabitStats(id: string) {
  return useQuery({
    queryKey: statsKeys.habit(id),
    queryFn: async ({ signal }) => {
      const { stats } = await api.get(
        `/habits/${id}/stats`,
        HabitStatsResponseSchema,
        { signal },
      )
      return stats
    },
  })
}
