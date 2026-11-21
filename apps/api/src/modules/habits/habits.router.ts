import { Router, type RequestHandler } from 'express'
import { z } from 'zod'

import { CreateHabitSchema, UpdateHabitSchema } from '@habit-tracker/shared'

import type { HabitsController } from './habits.controller.js'
import { validate } from '../../middleware/validate.js'

const idParams = z.object({ id: z.uuid() })

export function createHabitsRouter(
  controller: HabitsController,
  currentUser: RequestHandler,
) {
  const router = Router()

  router.get('/habits', currentUser, controller.list)
  router.post(
    '/habits',
    validate({ body: CreateHabitSchema }),
    currentUser,
    controller.create,
  )
  router.get(
    '/habits/:id',
    validate({ params: idParams }),
    currentUser,
    controller.get,
  )
  router.patch(
    '/habits/:id',
    validate({ params: idParams, body: UpdateHabitSchema }),
    currentUser,
    controller.update,
  )
  router.delete(
    '/habits/:id',
    validate({ params: idParams }),
    currentUser,
    controller.remove,
  )

  return router
}
