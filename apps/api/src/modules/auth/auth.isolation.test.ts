import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import {
  HabitListResponseSchema,
  HabitResponseSchema,
} from '@habit-tracker/shared'

import { createTestApp } from '../../test/test-app.js'
import { createTestDb } from '../../test/test-db.js'

describe('isolation between users', () => {
  const { pool, reset } = createTestDb()
  const app = createTestApp(pool)

  beforeEach(reset)
  afterAll(() => pool.end())

  async function signUp(email: string) {
    const agent = request.agent(app)
    const res = await agent
      .post('/api/auth/register')
      .send({ email, password: 'correct horse' })
    expect(res.status).toBe(201)
    return agent
  }

  async function setup() {
    const alice = await signUp('alice@test.local')
    const bob = await signUp('bob@test.local')
    const created = await alice
      .post('/api/habits')
      .send({ name: "Alice's habit", color: '#3B82F6' })
    const { habit } = HabitResponseSchema.parse(created.body)
    return { alice, bob, habit }
  }

  it("B does not see A's habit in the list", async () => {
    const { bob } = await setup()

    const res = await bob.get('/api/habits')

    expect(HabitListResponseSchema.parse(res.body).habits).toEqual([])
  })

  it("B cannot read, change or delete A's habit: 404 every time", async () => {
    const { alice, bob, habit } = await setup()
    const url = `/api/habits/${habit.id}`

    expect((await bob.get(url)).status).toBe(404)
    expect((await bob.patch(url).send({ name: 'Hacked' })).status).toBe(404)
    expect((await bob.delete(url)).status).toBe(404)

    const stillThere = await alice.get(url)
    expect(stillThere.status).toBe(200)
    expect(stillThere.body.habit.name).toBe("Alice's habit")
  })

  it("B cannot check or uncheck A's habit, and A's day stays untouched", async () => {
    const { alice, bob, habit } = await setup()
    const today = (await alice.get('/api/today')).body.date as string
    const url = `/api/habits/${habit.id}/checks/${today}`

    expect((await bob.put(url)).status).toBe(404)
    expect((await bob.delete(url)).status).toBe(404)

    const aliceToday = await alice.get('/api/today')
    expect(aliceToday.body.items[0].checked).toBe(false)
  })

  it("B's checks list does not include A's checks", async () => {
    const { alice, bob, habit } = await setup()
    const today = (await alice.get('/api/today')).body.date as string
    await alice.put(`/api/habits/${habit.id}/checks/${today}`)

    const res = await bob.get(`/api/checks?from=${today}&to=${today}`)

    expect(res.body).toEqual({ checks: [] })
  })
})
