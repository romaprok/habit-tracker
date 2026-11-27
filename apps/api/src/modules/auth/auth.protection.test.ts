import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'

import { ErrorResponseSchema } from '@habit-tracker/shared'

import { createTestApp } from '../../test/test-app.js'
import { createTestDb } from '../../test/test-db.js'

const WRONG = { email: 'nobody@test.local', password: 'wrong password' }

describe('auth endpoint protection', () => {
  const { pool } = createTestDb()

  afterAll(() => pool.end())

  it('answers 429 in the usual error shape after too many login attempts', async () => {
    const app = createTestApp(pool, {
      authRateLimit: { limit: 2, windowMs: 60_000 },
    })

    const first = await request(app).post('/api/auth/login').send(WRONG)
    const second = await request(app).post('/api/auth/login').send(WRONG)
    const third = await request(app).post('/api/auth/login').send(WRONG)

    expect([first.status, second.status]).toEqual([401, 401])
    expect(third.status).toBe(429)
    expect(ErrorResponseSchema.parse(third.body).error.code).toBe(
      'TOO_MANY_REQUESTS',
    )
    expect(third.headers['ratelimit-policy']).toBeDefined()
  })

  it('counts login and register separately', async () => {
    const app = createTestApp(pool, {
      authRateLimit: { limit: 1, windowMs: 60_000 },
    })

    await request(app).post('/api/auth/login').send(WRONG)
    const register = await request(app).post('/api/auth/register').send({})

    expect(register.status).toBe(400)
  })

  it('sets security headers and hides X-Powered-By', async () => {
    const res = await request(createTestApp(pool)).get('/api/health')

    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['x-powered-by']).toBeUndefined()
  })
})
