import {
  Router,
  type Request,
  type RequestHandler,
  type Response,
} from 'express'

import type { TodayResponse } from '@habit-tracker/shared'

import type { TodayService } from './today.service.js'

export function createTodayRouter(
  service: TodayService,
  currentUser: RequestHandler,
) {
  const router = Router()

  router.get(
    '/today',
    currentUser,
    async (req: Request, res: Response<TodayResponse>) => {
      if (!req.userId) throw new Error('No current user on the request')
      res.json(await service.forUser(req.userId))
    },
  )

  return router
}
