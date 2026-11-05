import { Pool } from 'pg'

import { logger } from './logger.js'

export const createPool = (connectionString: string) => {
  const pool = new Pool({ connectionString, connectionTimeoutMillis: 2000 })
  pool.on('error', (err) => {
    logger.error({ err }, 'Unexpected error on idle PostgreSQL client')
  })
  return pool
}
