import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { UserResponseSchema } from '@habit-tracker/shared'

import { createTokenService } from './tokens.js'
import { createTestApp, TEST_JWT_SECRET } from '../../test/test-app.js'
import { createTestDb } from '../../test/test-db.js'

const CREDENTIALS = { email: 'roman@test.local', password: 'correct horse' }

describe('session: /api/auth/me and /api/auth/logout', () => {
  const { pool, reset } = createTestDb()
  const app = createTestApp(pool)

  beforeEach(reset)
  afterAll(() => pool.end())

  it('returns 401 without a session cookie', async () => {
    const res = await request(app).get('/api/auth/me')

    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('returns the current user after login, and 401 again after logout', async () => {
    const agent = request.agent(app)
    await agent.post('/api/auth/register').send(CREDENTIALS)

    const me = await agent.get('/api/auth/me')
    expect(me.status).toBe(200)
    expect(UserResponseSchema.parse(me.body).user.email).toBe(CREDENTIALS.email)

    const logout = await agent.post('/api/auth/logout')
    expect(logout.status).toBe(204)
    expect(String(logout.headers['set-cookie'])).toMatch(/access_token=;/)

    expect((await agent.get('/api/auth/me')).status).toBe(401)
  })

  it('rejects a forged token', async () => {
    const forged = await createTokenService(
      'attacker-secret-0123456789abcdefghijk',
    ).signAccessToken('some-user-id')

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `access_token=${forged}`)

    expect(res.status).toBe(401)
  })

  it('returns 401 when the token belongs to a user that no longer exists', async () => {
    const token = await createTokenService(TEST_JWT_SECRET).signAccessToken(
      '0195f1a2-7c3e-7a00-8000-000000000001',
    )

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `access_token=${token}`)

    expect(res.status).toBe(401)
  })
})
