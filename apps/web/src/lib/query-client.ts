import { QueryClient } from '@tanstack/react-query'

import { ApiError } from './api-client.ts'

const MAX_RETRIES = 2

export const queryClient = new QueryClient({
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
