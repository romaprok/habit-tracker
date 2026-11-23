import express, { type RequestHandler } from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import {
  CreateHabitSchema,
  ErrorResponseSchema,
  UpdateHabitSchema,
} from '@habit-tracker/shared'

import { errorHandler } from './error-handler.js'
import { validate } from './validate.js'

const echo: RequestHandler = (req, res) => {
  res.json({ params: req.params, query: req.query, body: req.body })
}

function buildApp() {
  const app = express()
  app.use(express.json())
  app.post('/habits', validate({ body: CreateHabitSchema }), echo)
  app.patch(
    '/habits/:id',
    validate({ params: z.object({ id: z.uuid() }), body: UpdateHabitSchema }),
    echo,
  )
  app.get(
    '/items',
    validate({
      query: z.object({ limit: z.coerce.number().int().positive() }),
    }),
    echo,
  )
  app.use(errorHandler)
  return app
}

const app = buildApp()
const ID = '0195f1a2-7c3e-7a00-8000-000000000001'

describe('validate middleware', () => {
  it('passes parsed body to the handler: trimmed, unknown fields stripped', async () => {
    const res = await request(app)
      .post('/habits')
      .send({ name: '  Read  ', color: '#3B82F6', userId: 'evil' })

    expect(res.status).toBe(200)
    expect(res.body.body).toEqual({ name: 'Read', color: '#3B82F6' })
  })

  it('returns 400 VALIDATION_ERROR with errors per body field', async () => {
    const res = await request(app)
      .post('/habits')
      .send({ name: '', color: 'red' })

    expect(res.status).toBe(400)
    const { error } = ErrorResponseSchema.parse(res.body)
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(Object.keys(error.fields ?? {}).sort()).toEqual(['color', 'name'])
  })

  it('prefixes params errors and collects errors from several parts at once', async () => {
    const res = await request(app).patch('/habits/not-a-uuid').send({})

    expect(res.status).toBe(400)
    expect(Object.keys(res.body.error.fields).sort()).toEqual([
      '_root',
      'params.id',
    ])
  })

  it('replaces query with coerced values', async () => {
    const res = await request(app).get('/items?limit=10')

    expect(res.status).toBe(200)
    expect(res.body.query).toEqual({ limit: 10 })
  })

  it('reports invalid query values under the query prefix', async () => {
    const res = await request(app).get('/items?limit=abc')

    expect(res.status).toBe(400)
    expect(Object.keys(res.body.error.fields)).toEqual(['query.limit'])
  })

  it('valid params and body reach the handler', async () => {
    const res = await request(app).patch(`/habits/${ID}`).send({ name: 'New' })

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      params: { id: ID },
      body: { name: 'New' },
    })
  })

  it('answers malformed JSON with 400, not 500', async () => {
    const res = await request(app)
      .post('/habits')
      .set('Content-Type', 'application/json')
      .send('{"name": ')

    expect(res.status).toBe(400)
    expect(res.body.error).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Malformed JSON in request body',
    })
  })
})
