import { useQuery } from '@tanstack/react-query'

import { StreakListResponseSchema } from '@habit-tracker/shared'

import { statsKeys } from './stats-keys.ts'
import { api } from '../../lib/api-client.ts'

export type CurrentStreaks = ReadonlyMap<string, number>

// One request for every habit's streak; `select` turns the list into a
// lookup by habit id, and the cache keeps that result between renders.
export function useStreaks() {
  return useQuery({
    queryKey: statsKeys.streaks(),
    queryFn: ({ signal }) =>
      api.get('/streaks', StreakListResponseSchema, { signal }),
    select: (data): CurrentStreaks =>
      new Map(data.streaks.map((s) => [s.habitId, s.current])),
  })
}
