import { useEffect, useState } from 'react'

import { HabitListResponseSchema, type Habit } from '@habit-tracker/shared'

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
  const [state, setState] = useState<HabitsState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    api
      .get('/habits', HabitListResponseSchema, { signal: controller.signal })
      .then(({ habits }) => setState({ status: 'success', habits }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setState({ status: 'error', message: toErrorMessage(err) })
      })

    return () => controller.abort()
  }, [attempt])

  const retry = () => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }

  const remove = async (id: string) => {
    try {
      await api.delete(`/habits/${id}`)
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 404)) throw err
    }
    setState((current) =>
      current.status === 'success'
        ? {
            ...current,
            habits: current.habits.filter((habit) => habit.id !== id),
          }
        : current,
    )
  }

  return { state, retry, remove }
}
