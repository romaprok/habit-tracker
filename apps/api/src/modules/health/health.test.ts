import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'

import { createApp } from '../../app.js'
import { createPool } from '../../db/client.js'
import { createTestDb } from '../../test/test-db.js'

describe('GET /api/health', () => {
  const { pool } = createTestDb()
  const deadPool = createPool(
    'postgresql://habit:habit@localhost:5499/nowhere_test',
  )

  afterAll(async () => {
    await pool.end()
    await deadPool.end()
  })

  it('returns 200 when the database is reachable', async () => {
    const res = await request(createApp({ pool })).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ api: 'ok', db: 'ok' })
  })

  it('returns 503 when the database is unreachable', async () => {
    const res = await request(createApp({ pool: deadPool })).get('/api/health')
    expect(res.status).toBe(503)
    expect(res.body).toEqual({ api: 'ok', db: 'error' })
  })
})
