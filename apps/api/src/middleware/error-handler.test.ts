import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { ErrorResponseSchema } from '@habit-tracker/shared'

import { errorHandler } from './error-handler.js'
import { AppError, NotFoundError } from '../errors/app-error.js'

function appThatThrows(error: unknown) {
  const app = express()
  app.get('/boom', () => {
    throw error
  })
  app.use(errorHandler)
  return app
}

describe('errorHandler', () => {
  it('turns an AppError into its status and the shared error format', async () => {
    const res = await request(
      appThatThrows(new NotFoundError('Habit not found')),
    ).get('/boom')

    expect(res.status).toBe(404)
    expect(ErrorResponseSchema.parse(res.body)).toEqual({
      error: { code: 'NOT_FOUND', message: 'Habit not found' },
    })
  })

  it('passes field errors through', async () => {
    const error = new AppError(400, 'VALIDATION_ERROR', 'Validation failed', {
      name: ['Required'],
    })

    const res = await request(appThatThrows(error)).get('/boom')

    expect(res.status).toBe(400)
    expect(res.body.error.fields).toEqual({ name: ['Required'] })
  })

  it('hides details of unexpected errors behind a generic 500', async () => {
    const res = await request(
      appThatThrows(new Error('password=secret at db.ts:42')),
    ).get('/boom')

    expect(res.status).toBe(500)
    expect(res.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    })
    expect(JSON.stringify(res.body)).not.toContain('secret')
  })
})
