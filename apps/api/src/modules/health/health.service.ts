import type { Health } from '@habit-tracker/shared'

import type { HealthRepository } from './health.repository.js'

export function createHealthService(repository: HealthRepository) {
  return {
    async check(): Promise<Health> {
      try {
        await repository.ping()
        return { api: 'ok', db: 'ok' }
      } catch {
        return { api: 'ok', db: 'error' }
      }
    },
  }
}

export type HealthService = ReturnType<typeof createHealthService>
