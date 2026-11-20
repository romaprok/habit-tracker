import type { ErrorRequestHandler } from 'express'

import type { ErrorResponse } from '@habit-tracker/shared'

import { AppError } from '../errors/app-error.js'
import { logger } from '../logger.js'

function isMalformedJson(err: unknown) {
  return (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    err.type === 'entity.parse.failed'
  )
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (isMalformedJson(err)) {
    const body: ErrorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Malformed JSON in request body',
      },
    }
    res.status(400).json(body)
    return
  }

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
