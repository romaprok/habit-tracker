import type { Request, Response } from 'express'

import type { Register, UserResponse } from '@habit-tracker/shared'

import type { AuthService } from './auth.service.js'

export function createAuthController(service: AuthService) {
  return {
    async register(req: Request, res: Response<UserResponse>) {
      const user = await service.register(req.body as Register)
      res.status(201).json({ user })
    },
  }
}

export type AuthController = ReturnType<typeof createAuthController>
