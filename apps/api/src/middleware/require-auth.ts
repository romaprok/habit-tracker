import type { RequestHandler } from 'express'

import { UnauthorizedError } from '../errors/app-error.js'
import { ACCESS_COOKIE } from '../modules/auth/cookies.js'
import type { TokenService } from '../modules/auth/tokens.js'

export function createRequireAuth(tokens: TokenService): RequestHandler {
  return async (req, _res, next) => {
    const token: unknown = req.cookies?.[ACCESS_COOKIE]
    const userId =
      typeof token === 'string' ? await tokens.verifyAccessToken(token) : null

    if (!userId) {
      next(new UnauthorizedError())
      return
    }
    req.userId = userId
    next()
  }
}
