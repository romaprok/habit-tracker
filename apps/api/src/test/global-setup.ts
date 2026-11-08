import path from 'node:path'

import { migrate } from 'drizzle-orm/node-postgres/migrator'
import pg from 'pg'

import { getTestDatabaseUrl } from './test-db.js'
import { createDb, createPool } from '../db/client.js'

export default async function setup() {
  const testUrl = getTestDatabaseUrl()
  const dbName = new URL(testUrl).pathname.slice(1)
  if (!/^[a-z0-9_]+$/.test(dbName))
    throw new Error(`Unsafe database name: ${dbName}`)

  const adminUrl = new URL(testUrl)
  adminUrl.pathname = '/postgres'
  const admin = new pg.Client({ connectionString: adminUrl.toString() })
  await admin.connect()
  try {
    const { rowCount } = await admin.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName],
    )
    if (rowCount === 0) await admin.query(`CREATE DATABASE "${dbName}"`)
  } finally {
    await admin.end()
  }

  const pool = createPool(testUrl)
  try {
    await migrate(createDb(pool), {
      migrationsFolder: path.join(import.meta.dirname, '../../drizzle'),
    })
  } finally {
    await pool.end()
  }
}
