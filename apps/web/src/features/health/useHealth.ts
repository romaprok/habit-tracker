import { useQuery } from '@tanstack/react-query'

import { HealthSchema, type Health } from '@habit-tracker/shared'

import { api, ApiError } from '../../lib/api-client.ts'

async function fetchHealth(signal: AbortSignal): Promise<Health> {
  try {
    return await api.get('/health', HealthSchema, { signal })
  } catch (err) {
    if (err instanceof ApiError && err.status === 503) {
      return HealthSchema.parse(err.body)
    }
    throw err
  }
}

export const useHealth = () => {
  const query = useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => fetchHealth(signal),
    retry: false,
  })

  return { health: query.data ?? null, apiDown: query.isError }
}
