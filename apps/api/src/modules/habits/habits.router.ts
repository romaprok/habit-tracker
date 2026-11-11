import { Router, type RequestHandler } from 'express'

import type { HabitsController } from './habits.controller.js'

export function createHabitsRouter(
  controller: HabitsController,
  currentUser: RequestHandler,
) {
  const router = Router()
  router.get('/habits', currentUser, controller.list)
  return router
}
