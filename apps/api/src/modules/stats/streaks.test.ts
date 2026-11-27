import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { StreakListResponseSchema } from '@habit-tracker/shared'

import { habitChecks, habits, users } from '../../db/schema.js'
import { addDays, todayIn } from '../../lib/dates.js'
import { authCookie } from '../../test/auth.js'
import { createTestApp } from '../../test/test-app.js'
import { createTestDb } from '../../test/test-db.js'

describe('GET /api/streaks', () => {
  const { pool, db, reset } = createTestDb()
  const app = createTestApp(pool)

  beforeEach(reset)
  afterAll(() => pool.end())

  async function setup(timezone = 'UTC') {
    const [user] = await db
      .insert(users)
      .values({ email: 'a@test.local', timezone })
      .returning()
    const [habit] = await db
      .insert(habits)
      .values({ userId: user.id, name: 'Read', color: '#3B82F6' })
      .returning()
    return { user, habit, today: todayIn(timezone) }
  }

  async function streaksOf(userId: string) {
    const res = await request(app)
      .get('/api/streaks')
      .set('Cookie', await authCookie(userId))
    expect(res.status).toBe(200)
    return StreakListResponseSchema.parse(res.body)
  }

  it('counts the current and the longest run of days', async () => {
    const { user, habit, today } = await setup()
    // longest: 4 days a week ago; current: the last 3 days including today
    const days = [-10, -9, -8, -7, -2, -1, 0]
    await db
      .insert(habitChecks)
      .values(days.map((d) => ({ habitId: habit.id, date: addDays(today, d) })))

    const { date, streaks } = await streaksOf(user.id)

    expect(date).toBe(today)
    expect(streaks).toEqual([{ habitId: habit.id, current: 3, longest: 4 }])
  })

  it('returns zeros for a habit without checks', async () => {
    const { user, habit } = await setup()

    const { streaks } = await streaksOf(user.id)

    expect(streaks).toEqual([{ habitId: habit.id, current: 0, longest: 0 }])
  })

  it("does not show other users' habits", async () => {
    const { habit } = await setup()
    const [other] = await db
      .insert(users)
      .values({ email: 'b@test.local' })
      .returning()

    const { streaks } = await streaksOf(other.id)

    expect(streaks.map((s) => s.habitId)).not.toContain(habit.id)
  })

  it('requires a session', async () => {
    expect((await request(app).get('/api/streaks')).status).toBe(401)
  })
})
