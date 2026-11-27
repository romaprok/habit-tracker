const UNIQUE_VIOLATION = '23505'

function hasCode(value: unknown): value is { code: unknown } {
  return typeof value === 'object' && value !== null && 'code' in value
}

export function isUniqueViolation(err: unknown): boolean {
  if (hasCode(err) && err.code === UNIQUE_VIOLATION) return true
  const cause = err instanceof Error ? err.cause : undefined
  return hasCode(cause) && cause.code === UNIQUE_VIOLATION
}
