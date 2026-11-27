import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { CheckListResponseSchema } from '@habit-tracker/shared'

import { DEMO_USER_EMAIL } from '../../db/demo.js'
import { habitChecks, habits, users } from '../../db/schema.js'
import { authCookie } from '../../test/auth.js'
import { createTestApp } from '../../test/test-app.js'
import { createTestDb } from '../../test/test-db.js'

describe('GET /api/checks', () => {
  const { pool, db, reset } = createTestDb()
  const app = createTestApp(pool)
  let cookie = ''

  beforeEach(reset)
  afterAll(() => pool.end())

  async function seed() {
    const [demo] = await db
      .insert(users)
      .values({ email: DEMO_USER_EMAIL })
      .returning()
    cookie = await authCookie(demo.id)
    const [other] = await db
      .insert(users)
      .values({ email: 'other@test.local' })
      .returning()
    const [read, run] = await db
      .insert(habits)
      .values([
        { userId: demo.id, name: 'Read', color: '#3B82F6' },
        { userId: demo.id, name: 'Run', color: '#22C55E' },
      ])
      .returning()
    const [theirs] = await db
      .insert(habits)
      .values({ userId: other.id, name: 'Not mine', color: '#000000' })
      .returning()
    await db.insert(habitChecks).values([
      { habitId: read.id, date: '2026-11-16' },
      { habitId: read.id, date: '2026-11-20' },
      { habitId: run.id, date: '2026-11-22' },
      { habitId: read.id, date: '2026-11-23' },
      { habitId: theirs.id, date: '2026-11-20' },
    ])
    return { read, run }
  }

  it("returns only the user's checks inside the range, inclusive, sorted by date", async () => {
    const { read, run } = await seed()

    const res = await request(app)
      .get('/api/checks?from=2026-11-17&to=2026-11-22')
      .set('Cookie', cookie)

    expect(res.status).toBe(200)
    expect(CheckListResponseSchema.parse(res.body).checks).toEqual([
      { habitId: read.id, date: '2026-11-20' },
      { habitId: run.id, date: '2026-11-22' },
    ])
  })

  it('returns an empty list when nothing is checked in the range', async () => {
    await seed()

    const res = await request(app)
      .get('/api/checks?from=2026-01-01&to=2026-01-31')
      .set('Cookie', cookie)

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ checks: [] })
  })

  it('requires both dates', async () => {
    await seed()

    const res = await request(app)
      .get('/api/checks?from=2026-11-17')
      .set('Cookie', cookie)

    expect(res.status).toBe(400)
    expect(Object.keys(res.body.error.fields)).toEqual(['query.to'])
  })

  it('rejects from after to', async () => {
    await seed()

    const res = await request(app)
      .get('/api/checks?from=2026-11-22&to=2026-11-17')
      .set('Cookie', cookie)

    expect(res.status).toBe(400)
    expect(res.body.error.fields['query.to']).toEqual([
      '`from` must not be after `to`',
    ])
  })

  it('rejects a range longer than a year', async () => {
    await seed()

    const res = await request(app)
      .get('/api/checks?from=2025-01-01&to=2026-11-22')
      .set('Cookie', cookie)

    expect(res.status).toBe(400)
    expect(res.body.error.fields['query.to'][0]).toMatch(
      /shorter than 366 days/,
    )
  })
})
