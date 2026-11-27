import { eq } from 'drizzle-orm'
import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { ErrorResponseSchema, UserResponseSchema } from '@habit-tracker/shared'

import { users } from '../../db/schema.js'
import { createTestApp } from '../../test/test-app.js'
import { createTestDb } from '../../test/test-db.js'

describe('POST /api/auth/register', () => {
  const { pool, db, reset } = createTestDb()
  const app = createTestApp(pool)

  beforeEach(reset)
  afterAll(() => pool.end())

  async function findUser(email: string) {
    const [row] = await db.select().from(users).where(eq(users.email, email))
    return row
  }

  it('creates a user with a normalized email and returns it without the password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: '  Roman@Example.COM ',
      password: 'correct horse',
      timezone: 'Europe/Kyiv',
    })

    expect(res.status).toBe(201)
    const { user } = UserResponseSchema.parse(res.body)
    expect(user).toMatchObject({
      email: 'roman@example.com',
      timezone: 'Europe/Kyiv',
    })
    expect(JSON.stringify(res.body)).not.toMatch(/password/i)
    const row = await findUser('roman@example.com')
    expect(row.passwordHash).toMatch(/^\$argon2id\$/)
  })

  it('defaults the time zone to UTC', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@test.local', password: 'correct horse' })

    expect(res.status).toBe(201)
    expect(res.body.user.timezone).toBe('UTC')
  })

  it('returns 409 under the email field when the email is taken, ignoring case', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'taken@test.local', password: 'correct horse' })

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'TAKEN@test.local', password: 'another pass' })

    expect(res.status).toBe(409)
    const { error } = ErrorResponseSchema.parse(res.body)
    expect(error.code).toBe('CONFLICT')
    expect(error.fields).toEqual({
      email: ['An account with this email already exists'],
    })
  })

  it('returns 400 for an invalid email and a short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'nope', password: 'short' })

    expect(res.status).toBe(400)
    expect(Object.keys(res.body.error.fields).sort()).toEqual([
      'email',
      'password',
    ])
  })
})
