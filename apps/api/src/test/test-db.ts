import { sql } from 'drizzle-orm'

import { createDb, createPool } from '../db/client.js'

export function getTestDatabaseUrl() {
  const url = process.env.TEST_DATABASE_URL
  if (!url) throw new Error('TEST_DATABASE_URL is not set')

  const dbName = new URL(url).pathname.slice(1)
  if (!dbName.endsWith('_test')) {
    throw new Error(
      `Refusing to run tests against "${dbName}": test database name must end with _test`,
    )
  }
  return url
}

export function createTestDb() {
  const pool = createPool(getTestDatabaseUrl())
  const db = createDb(pool)

  async function reset() {
    await db.execute(sql`TRUNCATE users, habits RESTART IDENTITY CASCADE`)
  }

  return { pool, db, reset }
}
