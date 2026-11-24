import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { TodayResponse } from '@habit-tracker/shared'

import { todayKeys } from './today-keys.ts'
import { api } from '../../lib/api-client.ts'
import { checkKeys } from '../checks/check-keys.ts'

export type ToggleInput = { habitId: string; date: string; checked: boolean }

export const toggleCheckKey = ['toggle-check'] as const

export function useToggleCheck() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: toggleCheckKey,
    mutationFn: ({ habitId, date, checked }: ToggleInput) => {
      const path = `/habits/${habitId}/checks/${date}`
      return checked ? api.put(path) : api.delete(path)
    },

    onMutate: async ({ habitId, checked }) => {
      await queryClient.cancelQueries({ queryKey: todayKeys.all })
      const previous = queryClient.getQueryData<TodayResponse>(todayKeys.all)

      queryClient.setQueryData<TodayResponse>(
        todayKeys.all,
        (today) =>
          today && {
            ...today,
            items: today.items.map((item) =>
              item.habit.id === habitId ? { ...item, checked } : item,
            ),
          },
      )

      return { previous }
    },

    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(todayKeys.all, context.previous)
      }
    },

    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: todayKeys.all }),
        queryClient.invalidateQueries({ queryKey: checkKeys.all }),
      ]),
  })
}
