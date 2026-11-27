import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { habits, users } from '../db/schema.js'
import { authCookie } from '../test/auth.js'
import { createTestApp } from '../test/test-app.js'
import { createTestDb } from '../test/test-db.js'

const HABIT = { name: 'Read', color: '#3B82F6' }

describe('Origin check (CSRF)', () => {
  const { pool, db, reset } = createTestDb()
  const app = createTestApp(pool, {
    allowedOrigins: ['http://localhost:5173'],
  })
  let cookie = ''

  beforeEach(async () => {
    await reset()
    const [user] = await db
      .insert(users)
      .values({ email: 'a@test.local' })
      .returning()
    cookie = await authCookie(user.id)
  })
  afterAll(() => pool.end())

  function createHabit(origin?: string) {
    const req = request(app).post('/api/habits').set('Cookie', cookie)
    if (origin) req.set('Origin', origin)
    return req.send(HABIT)
  }

  it('rejects a state-changing request from a foreign origin with 403', async () => {
    const res = await createHabit('https://evil.example')

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
    expect(await db.$count(habits)).toBe(0)
  })

  it('rejects the opaque "null" origin', async () => {
    expect((await createHabit('null')).status).toBe(403)
  })

  it('accepts the web app origin and requests without Origin', async () => {
    expect((await createHabit('http://localhost:5173')).status).toBe(201)
    expect((await createHabit()).status).toBe(201)
  })

  it('does not check safe methods', async () => {
    const res = await request(app)
      .get('/api/habits')
      .set('Cookie', cookie)
      .set('Origin', 'https://evil.example')

    expect(res.status).toBe(200)
  })

  it('protects login too (login CSRF)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Origin', 'https://evil.example')
      .send({ email: 'a@test.local', password: 'whatever pass' })

    expect(res.status).toBe(403)
  })
})
