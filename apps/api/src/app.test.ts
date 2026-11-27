import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { ErrorResponseSchema } from '@habit-tracker/shared'

import { createTestApp } from './test/test-app.js'
import { createTestDb } from './test/test-db.js'

describe('app error handling', () => {
  const { pool, reset } = createTestDb()
  const app = createTestApp(pool)

  beforeEach(reset)
  afterAll(() => pool.end())

  it('returns 404 NOT_FOUND in the shared format for unknown routes', async () => {
    const res = await request(app).get('/api/nope')

    expect(res.status).toBe(404)
    expect(ErrorResponseSchema.parse(res.body).error).toEqual({
      code: 'NOT_FOUND',
      message: 'Route GET /api/nope not found',
    })
  })

  it('returns 500 INTERNAL_ERROR when the demo user is missing', async () => {
    const res = await request(app).get('/api/habits')

    expect(res.status).toBe(500)
    expect(ErrorResponseSchema.parse(res.body).error.code).toBe(
      'INTERNAL_ERROR',
    )
  })
})
