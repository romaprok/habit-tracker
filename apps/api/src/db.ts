import { Pool } from 'pg'
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 2000,
})
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err)
})
