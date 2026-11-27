import { Router } from 'express'

import { LoginSchema, RegisterSchema } from '@habit-tracker/shared'

import type { AuthController } from './auth.controller.js'
import { validate } from '../../middleware/validate.js'

export function createAuthRouter(controller: AuthController) {
  const router = Router()

  router.post(
    '/auth/register',
    validate({ body: RegisterSchema }),
    controller.register,
  )
  router.post('/auth/login', validate({ body: LoginSchema }), controller.login)

  return router
}
