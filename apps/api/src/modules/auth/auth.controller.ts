import type { Request, Response } from 'express'

import type { Login, Register, UserResponse } from '@habit-tracker/shared'

import type { AuthService } from './auth.service.js'
import { setAccessCookie } from './cookies.js'
import type { TokenService } from './tokens.js'

type Deps = {
  service: AuthService
  tokens: TokenService
  secureCookies: boolean
}

export function createAuthController({ service, tokens, secureCookies }: Deps) {
  async function signIn(res: Response, userId: string) {
    setAccessCookie(res, await tokens.signAccessToken(userId), secureCookies)
  }

  return {
    async register(req: Request, res: Response<UserResponse>) {
      const user = await service.register(req.body as Register)
      await signIn(res, user.id)
      res.status(201).json({ user })
    },

    async login(req: Request, res: Response<UserResponse>) {
      const user = await service.login(req.body as Login)
      await signIn(res, user.id)
      res.json({ user })
    },
  }
}

export type AuthController = ReturnType<typeof createAuthController>
