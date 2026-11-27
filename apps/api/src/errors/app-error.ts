import type { ErrorCode } from '@habit-tracker/shared'

export type FieldErrors = Record<string, string[]>

export class AppError extends Error {
  readonly status: number
  readonly code: ErrorCode
  readonly fields?: FieldErrors

  constructor(
    status: number,
    code: ErrorCode,
    message: string,
    fields?: FieldErrors,
  ) {
    super(message)
    this.name = new.target.name
    this.status = status
    this.code = code
    this.fields = fields
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, 'NOT_FOUND', message)
  }
}

export class ValidationError extends AppError {
  constructor(fields: FieldErrors, message = 'Request validation failed') {
    super(400, 'VALIDATION_ERROR', message, fields)
  }
}

export class ConflictError extends AppError {
  constructor(message: string, fields?: FieldErrors) {
    super(409, 'CONFLICT', message, fields)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, 'UNAUTHORIZED', message)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, 'FORBIDDEN', message)
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many attempts, please try again later') {
    super(429, 'TOO_MANY_REQUESTS', message)
  }
}
