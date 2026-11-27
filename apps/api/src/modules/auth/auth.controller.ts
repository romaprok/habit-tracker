import type { Request, Response } from 'express'

import type { Login, Register, UserResponse } from '@habit-tracker/shared'

import type { AuthService } from './auth.service.js'
import { clearAuthCookies, setSessionCookies } from './cookies.js'
import type { SessionService } from './session.service.js'

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
  async function signIn(res: Response, userId: string) {
    setSessionCookies(res, await sessions.start(userId), {
      secure: secureCookies,
      accessTtlSeconds,
    })
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

    logout(_req: Request, res: Response) {
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
