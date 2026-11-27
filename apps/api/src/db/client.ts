import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { logger } from '../logger.js'
import * as schema from './schema.js'

export function createPool(connectionString: string) {
  const pool = new Pool({ connectionString, connectionTimeoutMillis: 2000 })

  pool.on('error', (err) => {
    logger.error({ err }, 'Unexpected error on idle PostgreSQL client')
  })

  return pool
}

export function createDb(pool: Pool) {
  return drizzle({ client: pool, schema, casing: 'snake_case' })
}

export type Db = ReturnType<typeof createDb>

// A transaction has the same query API as the db, so repositories can be
// built over either one (Unit of Work: several repository calls, one commit).
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]
export type DbOrTx = Db | Tx
