import type { CookieOptions, Response } from 'express'

import { ACCESS_TOKEN_TTL_SECONDS } from './tokens.js'

export const ACCESS_COOKIE = 'access_token'

function baseOptions(secure: boolean): CookieOptions {
  return { httpOnly: true, sameSite: 'lax', secure, path: '/api' }
}

export function setAccessCookie(res: Response, token: string, secure: boolean) {
  res.cookie(ACCESS_COOKIE, token, {
    ...baseOptions(secure),
    maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
  })
}

export function clearAuthCookies(res: Response, secure: boolean) {
  res.clearCookie(ACCESS_COOKIE, baseOptions(secure))
}
