import { useMutation, useQueryClient } from '@tanstack/react-query'

import { todayKeys } from './today-keys.ts'
import { api } from '../../lib/api-client.ts'

type ToggleInput = { habitId: string; date: string; checked: boolean }

export function useToggleCheck() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ habitId, date, checked }: ToggleInput) => {
      const path = `/habits/${habitId}/checks/${date}`
      return checked ? api.put(path) : api.delete(path)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: todayKeys.all }),
  })
}
