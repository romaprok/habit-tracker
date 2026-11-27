import { and, eq } from 'drizzle-orm'
import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { DEMO_USER_EMAIL } from '../../db/demo.js'
import { habitChecks, habits, users } from '../../db/schema.js'
import { todayIn } from '../../lib/dates.js'
import { createTestApp } from '../../test/test-app.js'
import { createTestDb } from '../../test/test-db.js'

const KIRITIMATI = 'Pacific/Kiritimati'
const PAGO_PAGO = 'Pacific/Pago_Pago'

function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

describe('PUT and DELETE /api/habits/:id/checks/:date', () => {
  const { pool, db, reset } = createTestDb()
  const app = createTestApp(pool)

  beforeEach(reset)
  afterAll(() => pool.end())

  async function seed(timezone = 'Europe/Kyiv') {
    const [demo] = await db
      .insert(users)
      .values({ email: DEMO_USER_EMAIL, timezone })
      .returning()
    const [other] = await db
      .insert(users)
      .values({ email: 'other@test.local' })
      .returning()
    const [mine] = await db
      .insert(habits)
      .values({ userId: demo.id, name: 'Read', color: '#3B82F6' })
      .returning()
    const [theirs] = await db
      .insert(habits)
      .values({ userId: other.id, name: 'Not mine', color: '#000000' })
      .returning()
    return { mine, theirs, today: todayIn(timezone) }
  }

  async function countChecks(habitId: string, date: string) {
    return db.$count(
      habitChecks,
      and(eq(habitChecks.habitId, habitId), eq(habitChecks.date, date)),
    )
  }

  it('checks a habit for today and stays idempotent on repeat', async () => {
    const { mine, today } = await seed()
    const url = `/api/habits/${mine.id}/checks/${today}`

    expect((await request(app).put(url)).status).toBe(204)
    expect((await request(app).put(url)).status).toBe(204)
    expect(await countChecks(mine.id, today)).toBe(1)
  })

  it('unchecks a habit and stays idempotent on repeat', async () => {
    const { mine, today } = await seed()
    const url = `/api/habits/${mine.id}/checks/${today}`
    await request(app).put(url)

    expect((await request(app).delete(url)).status).toBe(204)
    expect((await request(app).delete(url)).status).toBe(204)
    expect(await countChecks(mine.id, today)).toBe(0)
  })

  it('allows past dates', async () => {
    const { mine, today } = await seed()
    const lastWeek = addDays(today, -7)

    const res = await request(app).put(
      `/api/habits/${mine.id}/checks/${lastWeek}`,
    )

    expect(res.status).toBe(204)
    expect(await countChecks(mine.id, lastWeek)).toBe(1)
  })

  it('rejects a future date with 400 on params.date', async () => {
    const { mine, today } = await seed()
    const tomorrow = addDays(today, 1)

    const res = await request(app).put(
      `/api/habits/${mine.id}/checks/${tomorrow}`,
    )

    expect(res.status).toBe(400)
    expect(res.body.error.fields).toEqual({
      'params.date': ['Date cannot be in the future'],
    })
    expect(await countChecks(mine.id, tomorrow)).toBe(0)
  })

  it("decides what 'future' means in the user's time zone", async () => {
    const aheadToday = todayIn(KIRITIMATI)

    const { mine } = await seed(KIRITIMATI)
    const allowed = await request(app).put(
      `/api/habits/${mine.id}/checks/${aheadToday}`,
    )
    expect(allowed.status).toBe(204)

    await reset()
    const behind = await seed(PAGO_PAGO)
    const rejected = await request(app).put(
      `/api/habits/${behind.mine.id}/checks/${aheadToday}`,
    )
    expect(rejected.status).toBe(400)
  })

  it("returns 404 for another user's habit and creates nothing", async () => {
    const { theirs, today } = await seed()
    const url = `/api/habits/${theirs.id}/checks/${today}`

    expect((await request(app).put(url)).status).toBe(404)
    expect((await request(app).delete(url)).status).toBe(404)
    expect(await countChecks(theirs.id, today)).toBe(0)
  })

  it('returns 400 for an impossible date', async () => {
    const { mine } = await seed()

    const res = await request(app).put(
      `/api/habits/${mine.id}/checks/2026-02-30`,
    )

    expect(res.status).toBe(400)
    expect(Object.keys(res.body.error.fields)).toEqual(['params.date'])
  })
})
