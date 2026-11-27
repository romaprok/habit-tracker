import request from 'supertest'
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import { HabitStatsResponseSchema } from '@habit-tracker/shared'

import { habitChecks, habits, users } from '../../db/schema.js'
import { authCookie } from '../../test/auth.js'
import { createTestApp } from '../../test/test-app.js'
import { createTestDb } from '../../test/test-db.js'

describe('GET /api/habits/:id/stats', () => {
  const { pool, db, reset } = createTestDb()
  const app = createTestApp(pool)

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-24T12:00:00Z'))
    await reset()
  })
  afterEach(() => vi.useRealTimers())
  afterAll(() => pool.end())

  async function setup() {
    const [user] = await db
      .insert(users)
      .values({ email: 'a@test.local' })
      .returning()
    const [habit] = await db
      .insert(habits)
      .values({ userId: user.id, name: 'Read', color: '#3B82F6' })
      .returning()
    return { user, habit, cookie: await authCookie(user.id) }
  }

  it('returns a full year of days ending today, with checked days marked', async () => {
    const { habit, cookie } = await setup()
    await db.insert(habitChecks).values([
      { habitId: habit.id, date: '2025-11-25' }, // first day of the range
      { habitId: habit.id, date: '2026-11-23' },
      { habitId: habit.id, date: '2026-11-24' },
      { habitId: habit.id, date: '2025-11-24' }, // a day too old: left out
    ])

    const res = await request(app)
      .get(`/api/habits/${habit.id}/stats`)
      .set('Cookie', cookie)

    expect(res.status).toBe(200)
    const { stats } = HabitStatsResponseSchema.parse(res.body)
    expect(stats).toMatchObject({ from: '2025-11-25', to: '2026-11-24' })
    expect(stats.days).toHaveLength(365)
    expect(stats.days[0]).toEqual({ date: '2025-11-25', checked: true })
    expect(stats.days.at(-1)).toEqual({ date: '2026-11-24', checked: true })
    expect(stats.days.filter((d) => d.checked)).toHaveLength(3)
    expect(stats.streak).toEqual({ current: 2, longest: 2 })
  })

  it('has no gaps and no duplicates in the calendar', async () => {
    const { habit, cookie } = await setup()

    const res = await request(app)
      .get(`/api/habits/${habit.id}/stats`)
      .set('Cookie', cookie)

    const dates = HabitStatsResponseSchema.parse(res.body).stats.days.map(
      (d) => d.date,
    )
    expect(new Set(dates).size).toBe(365)
    expect(dates).toEqual([...dates].sort())
  })

  it("returns 404 for another user's habit, same as for a missing one", async () => {
    const { habit } = await setup()
    const [other] = await db
      .insert(users)
      .values({ email: 'b@test.local' })
      .returning()

    const res = await request(app)
      .get(`/api/habits/${habit.id}/stats`)
      .set('Cookie', await authCookie(other.id))

    expect(res.status).toBe(404)
  })
})
