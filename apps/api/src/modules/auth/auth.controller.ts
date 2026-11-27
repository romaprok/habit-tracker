import type { Request, Response } from 'express'

import type { Login, Register, UserResponse } from '@habit-tracker/shared'

import type { AuthService } from './auth.service.js'
import {
  clearAuthCookies,
  REFRESH_COOKIE,
  setSessionCookies,
} from './cookies.js'
import type { SessionService } from './session.service.js'
import { UnauthorizedError } from '../../errors/app-error.js'

type Deps = {
  service: AuthService
  sessions: SessionService
  accessTtlSeconds: number
  secureCookies: boolean
}

export function createAuthController({
  service,
  sessions,
  accessTtlSeconds,
  secureCookies,
}: Deps) {
  const cookieSettings = { secure: secureCookies, accessTtlSeconds }

  async function signIn(res: Response, userId: string) {
    setSessionCookies(res, await sessions.start(userId), cookieSettings)
  }

  return {
    async register(req: Request, res: Response<UserResponse>) {
      const user = await service.register(req.body as Register)
      await signIn(res, user.id)
      res.status(201).json({ user })
    },

    async me(req: Request, res: Response<UserResponse>) {
      if (!req.userId) throw new Error('requireAuth must run before me')
      res.json({ user: await service.getUser(req.userId) })
    },

    async refresh(req: Request, res: Response) {
      const token: unknown = req.cookies?.[REFRESH_COOKIE]
      try {
        if (typeof token !== 'string') throw new UnauthorizedError()
        setSessionCookies(res, await sessions.refresh(token), cookieSettings)
        res.status(204).end()
      } catch (err) {
        // A dead refresh token is useless to the browser: drop both cookies.
        if (err instanceof UnauthorizedError) {
          clearAuthCookies(res, secureCookies)
        }
        throw err
      }
    },

    async logout(req: Request, res: Response) {
      const token: unknown = req.cookies?.[REFRESH_COOKIE]
      if (typeof token === 'string') await sessions.end(token)
      clearAuthCookies(res, secureCookies)
      res.status(204).end()
    },

    async login(req: Request, res: Response<UserResponse>) {
      const user = await service.login(req.body as Login)
      await signIn(res, user.id)
      res.json({ user })
    },
  }
}

export type AuthController = ReturnType<typeof createAuthController>
