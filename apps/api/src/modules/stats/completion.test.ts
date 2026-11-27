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
import { addDays } from '../../lib/dates.js'
import { authCookie } from '../../test/auth.js'
import { createTestApp } from '../../test/test-app.js'
import { createTestDb } from '../../test/test-db.js'

const TODAY = '2026-11-24'

describe('completion rate in GET /api/habits/:id/stats', () => {
  const { pool, db, reset } = createTestDb()
  const app = createTestApp(pool)

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(`${TODAY}T12:00:00Z`))
    await reset()
  })
  afterEach(() => vi.useRealTimers())
  afterAll(() => pool.end())

  async function completionOf(
    createdAt: string,
    checkOffsets: number[],
    timezone = 'UTC',
  ) {
    const [user] = await db
      .insert(users)
      .values({ email: 'a@test.local', timezone })
      .returning()
    const [habit] = await db
      .insert(habits)
      .values({
        userId: user.id,
        name: 'Read',
        color: '#3B82F6',
        createdAt: new Date(createdAt),
      })
      .returning()
    if (checkOffsets.length > 0) {
      await db.insert(habitChecks).values(
        checkOffsets.map((d) => ({
          habitId: habit.id,
          date: addDays(TODAY, d),
        })),
      )
    }
    const res = await request(app)
      .get(`/api/habits/${habit.id}/stats`)
      .set('Cookie', await authCookie(user.id))
    return HabitStatsResponseSchema.parse(res.body).stats.completion
  }

  it('counts the last 7 and the last 30 days, today included', async () => {
    const lastWeek = [0, -1, -2, -4, -6] // 5 of 7
    const before = [-7, -10, -15, -20, -25, -29, -30] // -30 is outside
    const { week, month } = await completionOf('2026-01-01T00:00:00Z', [
      ...lastWeek,
      ...before,
    ])

    expect(week).toEqual({ checked: 5, total: 7, rate: 5 / 7 })
    expect(month).toEqual({ checked: 11, total: 30, rate: 11 / 30 })
  })

  it('does not count days before the habit existed', async () => {
    const { week, month } = await completionOf('2026-11-23T10:00:00Z', [0])

    expect(week).toEqual({ checked: 1, total: 2, rate: 0.5 })
    expect(month.total).toBe(2)
  })

  it("takes the creation day in the user's time zone", async () => {
    // 23:30 UTC on Nov 23 is already Nov 24 in Kyiv.
    const { week } = await completionOf(
      '2026-11-23T23:30:00Z',
      [],
      'Europe/Kyiv',
    )

    expect(week).toEqual({ checked: 0, total: 1, rate: 0 })
  })

  it('starts the window at an earlier back-filled check', async () => {
    const { week } = await completionOf('2026-11-22T10:00:00Z', [-5])

    expect(week).toEqual({ checked: 1, total: 6, rate: 1 / 6 })
  })
})
