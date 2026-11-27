import type { RequestHandler } from 'express'

import { ForbiddenError } from '../errors/app-error.js'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

// CSRF defence in depth, on top of SameSite=Lax cookies: a browser always
// sends Origin with a cross-site POST/PUT/PATCH/DELETE, and a page cannot fake
// it. No Origin at all means a non-browser client (curl, tests, .http files):
// it has no victim's cookies to abuse, so it is let through.
export function createCheckOrigin(allowedOrigins: string[]): RequestHandler {
  const allowed = new Set(allowedOrigins)

  return (req, _res, next) => {
    const origin = req.get('origin')
    if (SAFE_METHODS.has(req.method) || origin === undefined) {
      next()
      return
    }
    if (!allowed.has(origin)) {
      next(new ForbiddenError('Request origin is not allowed'))
      return
    }
    next()
  }
}
