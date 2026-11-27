import { decodeJwt } from 'jose'
import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { ACCESS_COOKIE, REFRESH_COOKIE } from './cookies.js'
import { hashRefreshToken } from './refresh-tokens.js'
import { refreshTokens } from '../../db/schema.js'
import { createTestApp } from '../../test/test-app.js'
import { createTestDb } from '../../test/test-db.js'

function cookieNamed(res: request.Response, name: string) {
  const cookies = ([] as string[]).concat(res.headers['set-cookie'] ?? [])
  const cookie = cookies.find((c) => c.startsWith(`${name}=`))
  if (!cookie) throw new Error(`No ${name} cookie in the response`)
  return { raw: cookie, value: cookie.split(';')[0].slice(name.length + 1) }
}

describe('access and refresh token pair', () => {
  const { pool, db, reset } = createTestDb()
  const app = createTestApp(pool)

  beforeEach(reset)
  afterAll(() => pool.end())

  async function login() {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'roman@test.local', password: 'correct horse' })
    return request(app)
      .post('/api/auth/login')
      .send({ email: 'roman@test.local', password: 'correct horse' })
  }

  it('issues a short access token for all of /api', async () => {
    const res = await login()

    const access = cookieNamed(res, ACCESS_COOKIE)
    const { iat, exp } = decodeJwt(access.value)
    expect(exp! - iat!).toBe(15 * 60)
    expect(access.raw).toMatch(/Path=\/api;/)
    expect(access.raw).toMatch(/Max-Age=900/)
  })

  it('issues a 7-day refresh token sent only to /api/auth', async () => {
    const res = await login()

    const refresh = cookieNamed(res, REFRESH_COOKIE)
    expect(refresh.raw).toMatch(/HttpOnly/)
    expect(refresh.raw).toMatch(/SameSite=Lax/)
    expect(refresh.raw).toMatch(/Path=\/api\/auth/)
    expect(refresh.raw).toMatch(/Max-Age=604800/)
  })

  it('stores only the hash of the refresh token, one row per sign-in', async () => {
    const res = await login()

    const refresh = cookieNamed(res, REFRESH_COOKIE)
    const rows = await db.select().from(refreshTokens)
    expect(rows).toHaveLength(2) // register + login
    const hashes = rows.map((r) => r.tokenHash)
    expect(hashes).toContain(hashRefreshToken(refresh.value))
    expect(hashes).not.toContain(refresh.value)
    const ttl = rows[1].expiresAt.getTime() - rows[1].createdAt.getTime()
    expect(Math.round(ttl / 1000 / 3600)).toBe(7 * 24)
  })
})
