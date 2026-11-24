import { useQuery } from '@tanstack/react-query'

import { CheckListResponseSchema, type Check } from '@habit-tracker/shared'

import { checkKeys } from './check-keys.ts'
import { api } from '../../lib/api-client.ts'

export type ChecksByHabit = ReadonlyMap<string, ReadonlySet<string>>

function groupByHabit(checks: Check[]): ChecksByHabit {
  const byHabit = new Map<string, Set<string>>()
  for (const { habitId, date } of checks) {
    const dates = byHabit.get(habitId) ?? new Set<string>()
    dates.add(date)
    byHabit.set(habitId, dates)
  }
  return byHabit
}

export function useChecks(from: string | undefined, to: string | undefined) {
  return useQuery({
    queryKey: checkKeys.range(from ?? '', to ?? ''),
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({ from: from ?? '', to: to ?? '' })
      return api.get(`/checks?${params}`, CheckListResponseSchema, { signal })
    },
    select: (data) => groupByHabit(data.checks),
    enabled: Boolean(from && to),
  })
}
