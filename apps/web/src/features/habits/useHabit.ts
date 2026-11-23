import { useEffect, useState } from 'react'

import { HabitResponseSchema, type Habit } from '@habit-tracker/shared'

import { api, ApiError } from '../../lib/api-client.ts'

export type HabitState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | { status: 'success'; habit: Habit }

export function useHabit(id: string) {
  const [state, setState] = useState<HabitState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    api
      .get(`/habits/${id}`, HabitResponseSchema, { signal: controller.signal })
      .then(({ habit }) => setState({ status: 'success', habit }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        const notFound =
          err instanceof ApiError && (err.status === 404 || err.status === 400)
        setState(
          notFound
            ? { status: 'not-found' }
            : { status: 'error', message: 'Could not load the habit.' },
        )
      })

    return () => controller.abort()
  }, [id])

  return state
}
