import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { UserResponseSchema } from '@habit-tracker/shared'

import { ACCESS_COOKIE } from './cookies.js'
import { createTokenService } from './tokens.js'
import { users } from '../../db/schema.js'
import { createTestApp, TEST_JWT_SECRET } from '../../test/test-app.js'
import { createTestDb } from '../../test/test-db.js'

const tokens = createTokenService(TEST_JWT_SECRET)

function accessCookie(res: request.Response) {
  const cookies = ([] as string[]).concat(res.headers['set-cookie'] ?? [])
  return cookies.find((c) => c.startsWith(`${ACCESS_COOKIE}=`))
}

function tokenFrom(cookie: string) {
  return cookie.split(';')[0].slice(ACCESS_COOKIE.length + 1)
}

describe('POST /api/auth/login', () => {
  const { pool, db, reset } = createTestDb()
  const app = createTestApp(pool)

  beforeEach(reset)
  afterAll(() => pool.end())

  async function register(
    email = 'roman@test.local',
    password = 'correct horse',
  ) {
    return request(app).post('/api/auth/register').send({ email, password })
  }

  it('sets an httpOnly, SameSite=Lax JWT cookie and returns the user', async () => {
    await register()

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'Roman@Test.local', password: 'correct horse' })

    expect(res.status).toBe(200)
    const { user } = UserResponseSchema.parse(res.body)
    const cookie = accessCookie(res)
    expect(cookie).toBeDefined()
    expect(cookie).toMatch(/HttpOnly/)
    expect(cookie).toMatch(/SameSite=Lax/)
    expect(cookie).toMatch(/Path=\/api/)
    expect(await tokens.verifyAccessToken(tokenFrom(cookie!))).toBe(user.id)
  })

  it('signs the user in right after registration', async () => {
    const res = await register()

    expect(res.status).toBe(201)
    expect(accessCookie(res)).toBeDefined()
  })

  it('answers the same way for an unknown email and a wrong password', async () => {
    await register()

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: 'roman@test.local', password: 'wrong password' })
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.local', password: 'correct horse' })

    expect(wrongPassword.status).toBe(401)
    expect(unknownEmail.status).toBe(401)
    expect(wrongPassword.body).toEqual(unknownEmail.body)
    expect(wrongPassword.body.error).toEqual({
      code: 'UNAUTHORIZED',
      message: 'Invalid email or password',
    })
    expect(accessCookie(wrongPassword)).toBeUndefined()
  })

  it('rejects password login for a user without a password', async () => {
    await db.insert(users).values({ email: 'github-only@test.local' })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'github-only@test.local', password: 'anything at all' })

    expect(res.status).toBe(401)
  })
})

describe('token service', () => {
  it('rejects a token signed with another secret or tampered with', async () => {
    const other = createTokenService('another-secret-0123456789abcdefghij')
    const foreign = await other.signAccessToken('user-1')
    const valid = await tokens.signAccessToken('user-1')
    const tampered = `${valid.slice(0, -2)}xx`

    expect(await tokens.verifyAccessToken(foreign)).toBeNull()
    expect(await tokens.verifyAccessToken(tampered)).toBeNull()
    expect(await tokens.verifyAccessToken(valid)).toBe('user-1')
  })
})
