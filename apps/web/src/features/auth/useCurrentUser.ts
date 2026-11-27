import { useQuery } from '@tanstack/react-query'

import { UserResponseSchema, type User } from '@habit-tracker/shared'

import { authKeys } from './auth-keys.ts'
import { ApiError, api } from '../../lib/api-client.ts'

// 401 here is an answer, not an error: "nobody is logged in" → null.
async function fetchCurrentUser(signal: AbortSignal): Promise<User | null> {
  try {
    const { user } = await api.get('/auth/me', UserResponseSchema, { signal })
    return user
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null
    throw err
  }
}

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: ({ signal }) => fetchCurrentUser(signal),
    staleTime: Infinity,
  })
}
