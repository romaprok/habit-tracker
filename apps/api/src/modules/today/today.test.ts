import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { TodayResponseSchema } from '@habit-tracker/shared'

import { DEMO_USER_EMAIL } from '../../db/demo.js'
import { habitChecks, habits, users } from '../../db/schema.js'
import { todayIn } from '../../lib/dates.js'
import { createTestApp } from '../../test/test-app.js'
import { createTestDb } from '../../test/test-db.js'

function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

describe('GET /api/today', () => {
  const { pool, db, reset } = createTestDb()
  const app = createTestApp(pool)

  beforeEach(reset)
  afterAll(() => pool.end())

  it("lists the user's active habits with today's status in their time zone", async () => {
    const timezone = 'Pacific/Kiritimati'
    const today = todayIn(timezone)
    const [demo] = await db
      .insert(users)
      .values({ email: DEMO_USER_EMAIL, timezone })
      .returning()
    const [other] = await db
      .insert(users)
      .values({ email: 'other@test.local' })
      .returning()
    const [read, run] = await db
      .insert(habits)
      .values([
        { userId: demo.id, name: 'Read', color: '#3B82F6' },
        { userId: demo.id, name: 'Run', color: '#22C55E' },
        {
          userId: demo.id,
          name: 'Archived',
          color: '#999999',
          archivedAt: new Date(),
        },
        { userId: other.id, name: 'Not mine', color: '#000000' },
      ])
      .returning()
    await db.insert(habitChecks).values([
      { habitId: read.id, date: today },
      { habitId: run.id, date: addDays(today, -1) },
    ])

    const res = await request(app).get('/api/today')

    expect(res.status).toBe(200)
    const body = TodayResponseSchema.parse(res.body)
    expect(body.date).toBe(today)
    expect(body.items.map((i) => [i.habit.name, i.checked])).toEqual([
      ['Read', true],
      ['Run', false],
    ])
  })

  it('returns an empty list when the user has no habits', async () => {
    await db.insert(users).values({ email: DEMO_USER_EMAIL })

    const res = await request(app).get('/api/today')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ date: todayIn('UTC'), items: [] })
  })
})
