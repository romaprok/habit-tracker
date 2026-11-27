import { createHash, randomBytes } from 'node:crypto'

export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60

// An opaque random string, not a JWT: the database is the source of truth.
export function generateRefreshToken() {
  return randomBytes(32).toString('base64url')
}

// Only the hash is stored, so a leaked table cannot be replayed as cookies.
// A fast hash is enough here: the token has 256 bits of randomness.
export function hashRefreshToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}
