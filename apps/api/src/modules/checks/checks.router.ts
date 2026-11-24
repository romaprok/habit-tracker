import { Router, type RequestHandler } from 'express'
import { z } from 'zod'

import type { ChecksController } from './checks.controller.js'
import { validate } from '../../middleware/validate.js'

const checkParams = z.object({ id: z.uuid(), date: z.iso.date() })

export function createChecksRouter(
  controller: ChecksController,
  currentUser: RequestHandler,
) {
  const router = Router()

  router.put(
    '/habits/:id/checks/:date',
    validate({ params: checkParams }),
    currentUser,
    controller.check,
  )
  router.delete(
    '/habits/:id/checks/:date',
    validate({ params: checkParams }),
    currentUser,
    controller.uncheck,
  )

  return router
}
