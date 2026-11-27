import { randomBytes, timingSafeEqual } from 'node:crypto'

import type { CookieOptions, Response } from 'express'

export const OAUTH_STATE_COOKIE = 'oauth_state'

const STATE_TTL_SECONDS = 10 * 60

// The cookie travels only to the GitHub routes. SameSite=Lax is required:
// GitHub sends the user back with a top-level cross-site GET, and Lax
// cookies are sent on those (Strict ones are not).
function stateCookieOptions(secure: boolean): CookieOptions {
  return { httpOnly: true, sameSite: 'lax', secure, path: '/api/auth/github' }
}

// `state` ties the callback to the browser that started the login: without
// it an attacker could make you finish *their* login (login CSRF).
export function generateState() {
  return randomBytes(16).toString('base64url')
}

export function setStateCookie(res: Response, state: string, secure: boolean) {
  res.cookie(OAUTH_STATE_COOKIE, state, {
    ...stateCookieOptions(secure),
    maxAge: STATE_TTL_SECONDS * 1000,
  })
}

export function clearStateCookie(res: Response, secure: boolean) {
  res.clearCookie(OAUTH_STATE_COOKIE, stateCookieOptions(secure))
}

export function statesMatch(received: unknown, expected: unknown): boolean {
  if (typeof received !== 'string' || typeof expected !== 'string') {
    return false
  }
  const a = Buffer.from(received)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
