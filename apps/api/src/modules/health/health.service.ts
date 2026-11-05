import type { HealthRepository } from './health.repository.js'

export type HealthReport = { api: 'ok'; db: 'ok' | 'error' }

export function createHealthService(repository: HealthRepository) {
  return {
    async check(): Promise<HealthReport> {
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
