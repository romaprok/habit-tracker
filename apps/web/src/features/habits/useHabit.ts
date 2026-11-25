import { useQuery } from '@tanstack/react-query'

import { HabitResponseSchema, type Habit } from '@habit-tracker/shared'

import { habitKeys } from './habit-keys.ts'
import { api, ApiError } from '../../lib/api-client.ts'

export type HabitState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | { status: 'success'; habit: Habit }

function isNotFound(err: unknown) {
  return err instanceof ApiError && (err.status === 404 || err.status === 400)
}

export function useHabit(id: string): HabitState {
  const query = useQuery({
    queryKey: habitKeys.detail(id),
    queryFn: async ({ signal }) => {
      const { habit } = await api.get(`/habits/${id}`, HabitResponseSchema, {
        signal,
      })
      return habit
    },
  })

  if (query.status === 'pending') return { status: 'loading' }
  if (query.status === 'error') {
    return isNotFound(query.error)
      ? { status: 'not-found' }
      : { status: 'error', message: 'Could not load the habit.' }
  }
  return { status: 'success', habit: query.data }
}
