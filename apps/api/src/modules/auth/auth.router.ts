import { Router } from 'express'

import { RegisterSchema } from '@habit-tracker/shared'

import type { AuthController } from './auth.controller.js'
import { validate } from '../../middleware/validate.js'

export function createAuthRouter(controller: AuthController) {
  const router = Router()

  router.post(
    '/auth/register',
    validate({ body: RegisterSchema }),
    controller.register,
  )

  return router
}
