import { useEffect, useState } from 'react'

import { HealthSchema, type Health } from '@habit-tracker/shared'

import { api, ApiError } from '../../lib/api-client.ts'

export const useHealth = () => {
  const [health, setHealth] = useState<Health | null>(null)
  const [apiDown, setApiDown] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    api
      .get('/health', HealthSchema, { signal: controller.signal })
      .then(setHealth)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return

        const degraded =
          err instanceof ApiError && err.status === 503
            ? HealthSchema.safeParse(err.body)
            : null

        if (degraded?.success) setHealth(degraded.data)
        else setApiDown(true)
      })

    return () => controller.abort()
  }, [])

  return { health, apiDown }
}
