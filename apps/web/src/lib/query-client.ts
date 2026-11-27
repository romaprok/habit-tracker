import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

import { ApiError } from './api-client.ts'
import { authKeys } from '../features/auth/auth-keys.ts'

const MAX_RETRIES = 2

// Any 401 means the session is gone: mark the user as logged out,
// and <RequireAuth> sends them to the login page.
function onUnauthorized(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    queryClient.setQueryData(authKeys.me, null)
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: onUnauthorized }),
  mutationCache: new MutationCache({ onError: onUnauthorized }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const isClientError =
          error instanceof ApiError && error.status >= 400 && error.status < 500
        return !isClientError && failureCount < MAX_RETRIES
      },
    },
  },
})
