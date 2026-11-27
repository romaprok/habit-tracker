import type { CookieOptions, Response } from 'express'

import { REFRESH_TOKEN_TTL_SECONDS } from './refresh-tokens.js'
import type { Session } from './session.service.js'

export const ACCESS_COOKIE = 'access_token'
export const REFRESH_COOKIE = 'refresh_token'

// The access token goes to every API call; the refresh token only to
// /api/auth/*, so it is not sent (and cannot leak) with ordinary requests.
const ACCESS_PATH = '/api'
export const REFRESH_PATH = '/api/auth'

function baseOptions(secure: boolean, path: string): CookieOptions {
  return { httpOnly: true, sameSite: 'lax', secure, path }
}

type CookieSettings = { secure: boolean; accessTtlSeconds: number }

export function setSessionCookies(
  res: Response,
  session: Session,
  { secure, accessTtlSeconds }: CookieSettings,
) {
  res.cookie(ACCESS_COOKIE, session.accessToken, {
    ...baseOptions(secure, ACCESS_PATH),
    maxAge: accessTtlSeconds * 1000,
  })
  res.cookie(REFRESH_COOKIE, session.refreshToken, {
    ...baseOptions(secure, REFRESH_PATH),
    maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
  })
}

export function clearAuthCookies(res: Response, secure: boolean) {
  res.clearCookie(ACCESS_COOKIE, baseOptions(secure, ACCESS_PATH))
  res.clearCookie(REFRESH_COOKIE, baseOptions(secure, REFRESH_PATH))
}
