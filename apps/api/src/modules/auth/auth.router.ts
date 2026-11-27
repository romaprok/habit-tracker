import { Router, type RequestHandler } from 'express'

import { LoginSchema, RegisterSchema } from '@habit-tracker/shared'

import type { AuthController } from './auth.controller.js'
import {
  createRateLimit,
  type RateLimitOptions,
} from '../../middleware/rate-limit.js'
import { validate } from '../../middleware/validate.js'

export function createAuthRouter(
  controller: AuthController,
  requireAuth: RequestHandler,
  rateLimit: RateLimitOptions,
) {
  const router = Router()

  router.post(
    '/auth/register',
    createRateLimit(rateLimit),
    validate({ body: RegisterSchema }),
    controller.register,
  )
  router.post(
    '/auth/login',
    createRateLimit(rateLimit),
    validate({ body: LoginSchema }),
    controller.login,
  )
  router.get('/auth/me', requireAuth, controller.me)
  router.post('/auth/refresh', controller.refresh)
  router.post('/auth/logout', controller.logout)

  return router
}
