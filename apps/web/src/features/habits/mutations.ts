import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  HabitResponseSchema,
  type CreateHabit,
  type Habit,
  type UpdateHabit,
} from '@habit-tracker/shared'

import { habitKeys } from './habit-keys.ts'
import { api, ApiError } from '../../lib/api-client.ts'

export function useCreateHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateHabit) => {
      const { habit } = await api.post('/habits', input, HabitResponseSchema)
      return habit
    },
    onSuccess: (habit) => {
      queryClient.setQueryData(habitKeys.detail(habit.id), habit)
      return queryClient.invalidateQueries({
        queryKey: habitKeys.all,
        exact: true,
      })
    },
  })
}

export function useUpdateHabit(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateHabit) => {
      const { habit } = await api.patch(
        `/habits/${id}`,
        input,
        HabitResponseSchema,
      )
      return habit
    },
    onSuccess: (habit) => {
      queryClient.setQueryData(habitKeys.detail(id), habit)
      return queryClient.invalidateQueries({
        queryKey: habitKeys.all,
        exact: true,
      })
    },
  })
}

export function useDeleteHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await api.delete(`/habits/${id}`)
      } catch (err) {
        if (!(err instanceof ApiError && err.status === 404)) throw err
      }
    },
    onSuccess: (_result, id) => {
      queryClient.setQueryData<Habit[]>(habitKeys.all, (habits) =>
        habits?.filter((habit) => habit.id !== id),
      )
      queryClient.removeQueries({ queryKey: habitKeys.detail(id) })
    },
  })
}
