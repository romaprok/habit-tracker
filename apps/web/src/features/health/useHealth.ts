import { useEffect, useState } from 'react'

export type Health = { api: 'ok'; db: 'ok' | 'error' }

export const useHealth = () => {
  const [health, setHealth] = useState<Health | null>(null)
  const [apiDown, setApiDown] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/health', { signal: controller.signal })
      .then((res) => {
        if (!res.ok && res.status !== 503) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<Health>
      })
      .then(setHealth)
      .catch(() => {
        if (!controller.signal.aborted) setApiDown(true)
      })
    return () => controller.abort()
  }, [])
  return { health, apiDown }
}
