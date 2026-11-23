import { useEffect, useState } from 'react'

import { HabitResponseSchema, type Habit } from '@habit-tracker/shared'

import { api } from '../../lib/api-client.ts'

export type HabitState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; habit: Habit }

export function useHabit(id: string) {
  const [state, setState] = useState<HabitState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    api
      .get(`/habits/${id}`, HabitResponseSchema, { signal: controller.signal })
      .then(({ habit }) => setState({ status: 'success', habit }))
      .catch(() => {
        if (controller.signal.aborted) return
        setState({ status: 'error', message: 'Could not load the habit.' })
      })

    return () => controller.abort()
  }, [id])

  return state
}
