import type { Pool } from 'pg'

export function createHealthRepository(pool: Pool) {
  return {
    async ping() {
      await pool.query('SELECT 1')
    },
  }
}

export type HealthRepository = ReturnType<typeof createHealthRepository>
