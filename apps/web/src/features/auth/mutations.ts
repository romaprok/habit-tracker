import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  UserResponseSchema,
  type Login,
  type Register,
  type User,
} from '@habit-tracker/shared'

import { authKeys } from './auth-keys.ts'
import { api, noContent } from '../../lib/api-client.ts'

function useSignIn<T>(path: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: T): Promise<User> => {
      const { user } = await api.post(path, input, UserResponseSchema)
      return user
    },
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me, user)
    },
  })
}

export function useLogin() {
  return useSignIn<Login>('/auth/login')
}

export function useRegister() {
  return useSignIn<Register>('/auth/register')
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.post('/auth/logout', {}, noContent),
    onSuccess: () => {
      // First tell everyone subscribed to ['me'] that nobody is logged in:
      // <RequireAuth> redirects to /login. Not clear() first — it would drop
      // the ['me'] query itself, and the new null would land in a fresh
      // query that the mounted components are not subscribed to.
      queryClient.setQueryData(authKeys.me, null)
      // Then forget the previous user's data, so the next one never sees it.
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== authKeys.me[0],
      })
    },
  })
}
