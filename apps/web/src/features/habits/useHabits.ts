import { useQuery } from '@tanstack/react-query'

import { HabitListResponseSchema, type Habit } from '@habit-tracker/shared'

import { habitKeys } from './habit-keys.ts'
import { api, ApiError } from '../../lib/api-client.ts'

export type HabitsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; habits: Habit[] }

function toErrorMessage(err: unknown) {
  if (err instanceof ApiError && err.status === 0) {
    return 'Cannot reach the server. Check that the API is running.'
  }
  return 'Could not load habits. Please try again.'
}

export function useHabits() {
  const query = useQuery({
    queryKey: habitKeys.all,
    queryFn: async ({ signal }) => {
      const { habits } = await api.get('/habits', HabitListResponseSchema, {
        signal,
      })
      return habits
    },
  })

  const state: HabitsState =
    query.status === 'pending' || (query.status === 'error' && query.isFetching)
      ? { status: 'loading' }
      : query.status === 'error'
        ? { status: 'error', message: toErrorMessage(query.error) }
        : { status: 'success', habits: query.data }

  const retry = () => {
    void query.refetch()
  }

  return { state, retry }
}
