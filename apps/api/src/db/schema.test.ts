import { eq } from 'drizzle-orm'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { habitChecks, habits, users } from './schema.js'
import { createTestDb } from '../test/test-db.js'

describe('habit_checks and users.timezone', () => {
  const { pool, db, reset } = createTestDb()

  beforeEach(reset)
  afterAll(() => pool.end())

  async function createHabit() {
    const [user] = await db
      .insert(users)
      .values({ email: 'a@test.local' })
      .returning()
    const [habit] = await db
      .insert(habits)
      .values({ userId: user.id, name: 'Read', color: '#3B82F6' })
      .returning()
    return { user, habit }
  }

  it('gives new users the UTC timezone and no password by default', async () => {
    const { user } = await createHabit()

    expect(user.timezone).toBe('UTC')
    expect(user.passwordHash).toBeNull()
  })

  it('stores the check date as a plain YYYY-MM-DD string', async () => {
    const { habit } = await createHabit()

    const [check] = await db
      .insert(habitChecks)
      .values({ habitId: habit.id, date: '2026-11-24' })
      .returning()

    expect(check.date).toBe('2026-11-24')
  })

  it('allows only one check per habit per day', async () => {
    const { habit } = await createHabit()
    await db
      .insert(habitChecks)
      .values({ habitId: habit.id, date: '2026-11-24' })

    await expect(
      db.insert(habitChecks).values({ habitId: habit.id, date: '2026-11-24' }),
    ).rejects.toMatchObject({ cause: { code: '23505' } })
  })

  it('deletes the checks together with their habit', async () => {
    const { habit } = await createHabit()
    await db.insert(habitChecks).values([
      { habitId: habit.id, date: '2026-11-23' },
      { habitId: habit.id, date: '2026-11-24' },
    ])

    await db.delete(habits).where(eq(habits.id, habit.id))

    expect(await db.$count(habitChecks)).toBe(0)
  })
})
