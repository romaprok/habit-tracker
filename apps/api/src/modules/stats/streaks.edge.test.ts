import { eq } from 'drizzle-orm'
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

import { StreakListResponseSchema } from '@habit-tracker/shared'

import { habitChecks, habits, users } from '../../db/schema.js'
import { addDays } from '../../lib/dates.js'
import { authCookie } from '../../test/auth.js'
import { createTestApp } from '../../test/test-app.js'
import { createTestDb } from '../../test/test-db.js'

// 22:30 UTC on Nov 24 is already 00:30 on Nov 25 in Kyiv (UTC+2).
const NOW = new Date('2026-11-24T22:30:00Z')

describe('streak edge cases', () => {
  const { pool, db, reset } = createTestDb()
  const app = createTestApp(pool)

  beforeEach(async () => {
    // Only Date is faked: timers stay real, so pg and supertest keep working.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    await reset()
  })
  afterEach(() => vi.useRealTimers())
  afterAll(() => pool.end())

  async function habitWithChecks(dates: string[], timezone = 'UTC') {
    const [user] = await db
      .insert(users)
      .values({ email: 'a@test.local', timezone })
      .returning()
    const [habit] = await db
      .insert(habits)
      .values({ userId: user.id, name: 'Read', color: '#3B82F6' })
      .returning()
    if (dates.length > 0) {
      await db
        .insert(habitChecks)
        .values(dates.map((date) => ({ habitId: habit.id, date })))
    }
    return user
  }

  async function streakOf(userId: string) {
    const res = await request(app)
      .get('/api/streaks')
      .set('Cookie', await authCookie(userId))
    const { streaks } = StreakListResponseSchema.parse(res.body)
    const { current, longest } = streaks[0]
    return { current, longest }
  }

  const today = '2026-11-24' // in UTC at NOW
  const day = (offset: number) => addDays(today, offset)

  it('a skipped day breaks the run', async () => {
    const user = await habitWithChecks([day(-4), day(-3), day(-1), day(0)])

    expect(await streakOf(user.id)).toEqual({ current: 2, longest: 2 })
  })

  it('today not checked yet does not break the streak', async () => {
    const user = await habitWithChecks([day(-3), day(-2), day(-1)])

    expect(await streakOf(user.id)).toEqual({ current: 3, longest: 3 })
  })

  it('yesterday not checked does break it', async () => {
    const user = await habitWithChecks([day(-4), day(-3), day(-2)])

    expect(await streakOf(user.id)).toEqual({ current: 0, longest: 3 })
  })

  it('a single check today is a streak of one', async () => {
    const user = await habitWithChecks([day(0)])

    expect(await streakOf(user.id)).toEqual({ current: 1, longest: 1 })
  })

  it('a run goes on across months', async () => {
    const user = await habitWithChecks([
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
    ])

    expect(await streakOf(user.id)).toMatchObject({ longest: 4 })
  })

  describe('time zones', () => {
    const checks = ['2026-11-22', '2026-11-23']

    it("uses the user's today: alive in UTC, broken in Kyiv at the same moment", async () => {
      const utcUser = await habitWithChecks(checks, 'UTC')
      expect(await streakOf(utcUser.id)).toEqual({ current: 2, longest: 2 })

      await reset()
      const kyivUser = await habitWithChecks(checks, 'Europe/Kyiv')
      expect(await streakOf(kyivUser.id)).toEqual({ current: 0, longest: 2 })
    })

    it('ignores checks that are in the future after a time zone change', async () => {
      // Checked "today" in Kyiv (Nov 25), then moved to UTC where it is Nov 24.
      const user = await habitWithChecks(
        ['2026-11-23', '2026-11-24', '2026-11-25'],
        'Europe/Kyiv',
      )
      expect(await streakOf(user.id)).toEqual({ current: 3, longest: 3 })

      await db
        .update(users)
        .set({ timezone: 'UTC' })
        .where(eq(users.id, user.id))

      expect(await streakOf(user.id)).toEqual({ current: 2, longest: 2 })
    })
  })
})
