import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { createTestDb } from './test-db.js'
import { users } from '../db/schema.js'

describe('test database', () => {
  const { pool, db, reset } = createTestDb()

  beforeEach(reset)
  afterAll(() => pool.end())

  it('is migrated and accepts inserts', async () => {
    await db.insert(users).values({ email: 'a@test.local' })
    expect(await db.$count(users)).toBe(1)
  })

  it('starts every test with empty tables', async () => {
    expect(await db.$count(users)).toBe(0)
  })
})
