import { Pool } from 'pg'

import { config } from './config.js'
import { logger } from './logger.js'

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  connectionTimeoutMillis: 2000,
})
pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected error on idle PostgreSQL client')
})
