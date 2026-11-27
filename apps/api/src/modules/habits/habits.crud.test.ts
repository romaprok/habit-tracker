import { eq } from 'drizzle-orm'
import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { ErrorResponseSchema, HabitResponseSchema } from '@habit-tracker/shared'

import { DEMO_USER_EMAIL } from '../../db/demo.js'
import { habits, users } from '../../db/schema.js'
import { authCookie } from '../../test/auth.js'
import { createTestApp } from '../../test/test-app.js'
import { createTestDb } from '../../test/test-db.js'

const MISSING_ID = '0195f1a2-7c3e-7a00-8000-000000000001'

describe('habits CRUD', () => {
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
    const [mine] = await db
      .insert(habits)
      .values({ userId: demo.id, name: 'Read', color: '#3B82F6' })
      .returning()
    const [theirs] = await db
      .insert(habits)
      .values({ userId: other.id, name: 'Not mine', color: '#000000' })
      .returning()
    return { demo, mine, theirs }
  }

  async function findHabit(id: string) {
    const [row] = await db.select().from(habits).where(eq(habits.id, id))
    return row
  }

  describe('POST /api/habits', () => {
    it('creates a habit for the current user and returns 201 with Location', async () => {
      const { demo } = await seed()

      const res = await request(app)
        .post('/api/habits')
        .set('Cookie', cookie)
        .send({ name: '  Run  ', color: '#22C55E', userId: 'evil' })

      expect(res.status).toBe(201)
      const { habit } = HabitResponseSchema.parse(res.body)
      expect(habit).toMatchObject({ name: 'Run', description: null })
      expect(res.headers.location).toBe(`/api/habits/${habit.id}`)
      expect((await findHabit(habit.id)).userId).toBe(demo.id)
    })

    it('returns 400 with field errors for invalid input', async () => {
      await seed()

      const res = await request(app)
        .post('/api/habits')
        .set('Cookie', cookie)
        .send({ name: '', color: 'red' })

      expect(res.status).toBe(400)
      const { error } = ErrorResponseSchema.parse(res.body)
      expect(Object.keys(error.fields ?? {}).sort()).toEqual(['color', 'name'])
    })
  })

  describe('GET /api/habits/:id', () => {
    it('returns the habit of the current user', async () => {
      const { mine } = await seed()

      const res = await request(app)
        .get(`/api/habits/${mine.id}`)
        .set('Cookie', cookie)

      expect(res.status).toBe(200)
      expect(HabitResponseSchema.parse(res.body).habit.name).toBe('Read')
    })

    it('returns 404 for a habit of another user, same as for a missing one', async () => {
      const { theirs } = await seed()

      const foreign = await request(app)
        .get(`/api/habits/${theirs.id}`)
        .set('Cookie', cookie)
      const missing = await request(app)
        .get(`/api/habits/${MISSING_ID}`)
        .set('Cookie', cookie)

      expect(foreign.status).toBe(404)
      expect(missing.status).toBe(404)
      expect(foreign.body).toEqual(missing.body)
    })

    it('returns 400 for an id that is not a UUID', async () => {
      await seed()

      const res = await request(app)
        .get('/api/habits/123')
        .set('Cookie', cookie)

      expect(res.status).toBe(400)
      expect(Object.keys(res.body.error.fields)).toEqual(['params.id'])
    })
  })

  describe('PATCH /api/habits/:id', () => {
    it('updates only the provided fields', async () => {
      const { mine } = await seed()

      const res = await request(app)
        .patch(`/api/habits/${mine.id}`)
        .set('Cookie', cookie)
        .send({ name: 'Read 30 minutes' })

      expect(res.status).toBe(200)
      expect(HabitResponseSchema.parse(res.body).habit).toMatchObject({
        name: 'Read 30 minutes',
        color: '#3B82F6',
      })
    })

    it('returns 400 for an empty body', async () => {
      const { mine } = await seed()

      const res = await request(app)
        .patch(`/api/habits/${mine.id}`)
        .set('Cookie', cookie)
        .send({})

      expect(res.status).toBe(400)
      expect(Object.keys(res.body.error.fields)).toEqual(['_root'])
    })

    it('returns 404 for a habit of another user and leaves it unchanged', async () => {
      const { theirs } = await seed()

      const res = await request(app)
        .patch(`/api/habits/${theirs.id}`)
        .set('Cookie', cookie)
        .send({ name: 'Hacked' })

      expect(res.status).toBe(404)
      expect((await findHabit(theirs.id)).name).toBe('Not mine')
    })
  })

  describe('DELETE /api/habits/:id', () => {
    it('deletes the habit of the current user with 204', async () => {
      const { mine } = await seed()

      const res = await request(app)
        .delete(`/api/habits/${mine.id}`)
        .set('Cookie', cookie)

      expect(res.status).toBe(204)
      expect(res.text).toBe('')
      expect(await findHabit(mine.id)).toBeUndefined()
    })

    it('returns 404 for a habit of another user and keeps it', async () => {
      const { theirs } = await seed()

      const res = await request(app)
        .delete(`/api/habits/${theirs.id}`)
        .set('Cookie', cookie)

      expect(res.status).toBe(404)
      expect(await findHabit(theirs.id)).toBeDefined()
    })
  })
})
