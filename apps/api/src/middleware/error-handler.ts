import type { ErrorRequestHandler } from 'express'

import type { ErrorResponse } from '@habit-tracker/shared'

import { AppError } from '../errors/app-error.js'
import { logger } from '../logger.js'

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    const body: ErrorResponse = {
      error: { code: err.code, message: err.message, fields: err.fields },
    }
    res.status(err.status).json(body)
    return
  }

  logger.error(
    { err, method: req.method, path: req.path },
    'Unhandled error while processing request',
  )
  const body: ErrorResponse = {
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
  }
  res.status(500).json(body)
}
