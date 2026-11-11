import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { HabitListResponseSchema } from '@habit-tracker/shared'

import { createApp } from '../../app.js'
import { DEMO_USER_EMAIL } from '../../db/demo.js'
import { habits, users } from '../../db/schema.js'
import { createTestDb } from '../../test/test-db.js'

describe('GET /api/habits', () => {
  const { pool, db, reset } = createTestDb()
  const app = createApp({ pool })

  beforeEach(reset)
  afterAll(() => pool.end())

  it('returns only the demo user habits in the shared contract shape', async () => {
    const [demo] = await db
      .insert(users)
      .values({ email: DEMO_USER_EMAIL })
      .returning()
    const [other] = await db
      .insert(users)
      .values({ email: 'other@test.local' })
      .returning()
    await db.insert(habits).values([
      { userId: demo.id, name: 'Read', color: '#3B82F6' },
      { userId: demo.id, name: 'Run', description: '5 km', color: '#22C55E' },
      { userId: other.id, name: 'Not mine', color: '#000000' },
    ])

    const res = await request(app).get('/api/habits')

    expect(res.status).toBe(200)
    const body = HabitListResponseSchema.parse(res.body)
    expect(body.habits.map((h) => h.name)).toEqual(['Read', 'Run'])
    expect(res.body.habits[0]).not.toHaveProperty('userId')
  })

  it('returns an empty list when the demo user has no habits', async () => {
    await db.insert(users).values({ email: DEMO_USER_EMAIL })

    const res = await request(app).get('/api/habits')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ habits: [] })
  })
})
