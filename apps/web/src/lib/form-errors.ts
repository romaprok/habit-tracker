import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'

import { ApiError } from './api-client.ts'

export function serverErrorMessage(err: unknown, fallback: string) {
  if (err instanceof ApiError && err.status === 0) {
    return 'Cannot reach the server. Check your connection and try again.'
  }
  if (err instanceof ApiError) return err.message
  return fallback
}

export function applyServerErrors<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
  fallback: string,
) {
  const serverFields = err instanceof ApiError ? err.fields : {}
  let shownUnderFields = 0

  for (const field of fields) {
    const message = serverFields[field]?.[0]
    if (message) {
      setError(field, { type: 'server', message })
      shownUnderFields += 1
    }
  }

  if (shownUnderFields === 0) {
    setError('root.server', { message: serverErrorMessage(err, fallback) })
  }
}
