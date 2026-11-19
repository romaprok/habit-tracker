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
