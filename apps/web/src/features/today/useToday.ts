import { useQuery } from '@tanstack/react-query'

import { TodayResponseSchema, type TodayItem } from '@habit-tracker/shared'

import { todayKeys } from './today-keys.ts'
import { api, ApiError } from '../../lib/api-client.ts'

export type TodayState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; date: string; items: TodayItem[] }

function toErrorMessage(err: unknown) {
  if (err instanceof ApiError && err.status === 0) {
    return 'Cannot reach the server. Check that the API is running.'
  }
  return "Could not load today's habits. Please try again."
}

export function useToday() {
  const query = useQuery({
    queryKey: todayKeys.all,
    queryFn: ({ signal }) => api.get('/today', TodayResponseSchema, { signal }),
  })

  const state: TodayState =
    query.status === 'pending' || (query.status === 'error' && query.isFetching)
      ? { status: 'loading' }
      : query.status === 'error'
        ? { status: 'error', message: toErrorMessage(query.error) }
        : { status: 'success', date: query.data.date, items: query.data.items }

  return {
    state,
    retry: () => {
      void query.refetch()
    },
  }
}
