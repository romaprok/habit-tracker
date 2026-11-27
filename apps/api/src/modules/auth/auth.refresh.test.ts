import { eq } from 'drizzle-orm'
import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { ACCESS_COOKIE, REFRESH_COOKIE } from './cookies.js'
import { generateRefreshToken, hashRefreshToken } from './refresh-tokens.js'
import { createTokenService } from './tokens.js'
import { refreshTokens, users } from '../../db/schema.js'
import { createTestApp, TEST_JWT_SECRET } from '../../test/test-app.js'
import { createTestDb } from '../../test/test-db.js'

const tokens = createTokenService(TEST_JWT_SECRET)

function cookieValue(res: request.Response, name: string) {
  const cookies = ([] as string[]).concat(res.headers['set-cookie'] ?? [])
  const cookie = cookies.find((c) => c.startsWith(`${name}=`))
  return cookie?.split(';')[0].slice(name.length + 1)
}

describe('POST /api/auth/refresh', () => {
  const { pool, db, reset } = createTestDb()
  const app = createTestApp(pool)

  beforeEach(reset)
  afterAll(() => pool.end())

  async function signUp() {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'roman@test.local', password: 'correct horse' })
    return {
      userId: res.body.user.id as string,
      refreshToken: cookieValue(res, REFRESH_COOKIE)!,
    }
  }

  function refresh(token: string) {
    return request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `${REFRESH_COOKIE}=${token}`)
  }

  async function rowFor(token: string) {
    const [row] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, hashRefreshToken(token)))
    return row
  }

  it('rotates the pair: new access and refresh cookies, old token marked used', async () => {
    const { userId, refreshToken } = await signUp()

    const res = await refresh(refreshToken)

    expect(res.status).toBe(204)
    const access = cookieValue(res, ACCESS_COOKIE)!
    const next = cookieValue(res, REFRESH_COOKIE)!
    expect(await tokens.verifyAccessToken(access)).toBe(userId)
    expect(next).not.toBe(refreshToken)
    expect((await rowFor(refreshToken)).usedAt).not.toBeNull()
    expect((await rowFor(next)).usedAt).toBeNull()
  })

  it('returns 401 and clears cookies without a refresh cookie or with an unknown one', async () => {
    const missing = await request(app).post('/api/auth/refresh')
    const unknown = await refresh(generateRefreshToken())

    expect(missing.status).toBe(401)
    expect(unknown.status).toBe(401)
    expect(cookieValue(unknown, REFRESH_COOKIE)).toBe('')
  })

  it('returns 401 for an expired refresh token', async () => {
    const [user] = await db
      .insert(users)
      .values({ email: 'old@test.local' })
      .returning()
    const token = generateRefreshToken()
    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: hashRefreshToken(token),
      expiresAt: new Date(Date.now() - 1000),
    })

    expect((await refresh(token)).status).toBe(401)
  })

  it('treats reuse of an exchanged token as theft and ends all sessions', async () => {
    const { userId, refreshToken: stolen } = await signUp()
    const rotated = await refresh(stolen)
    const legit = cookieValue(rotated, REFRESH_COOKIE)!

    const replay = await refresh(stolen)

    expect(replay.status).toBe(401)
    expect(
      await db.$count(refreshTokens, eq(refreshTokens.userId, userId)),
    ).toBe(0)
    expect((await refresh(legit)).status).toBe(401)
  })

  it('lets only one of two parallel requests exchange the same token', async () => {
    const { refreshToken } = await signUp()

    const results = await Promise.all([
      refresh(refreshToken),
      refresh(refreshToken),
    ])

    expect(results.map((r) => r.status).sort()).toEqual([204, 401])
  })
})
