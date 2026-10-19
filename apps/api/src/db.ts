import { Pool } from 'pg'
import { config } from './config.js'

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  connectionTimeoutMillis: 2000,
})
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err)
})
