import {
  Router,
  type Request,
  type RequestHandler,
  type Response,
} from 'express'

import type { StreakListResponse } from '@habit-tracker/shared'

import type { StatsService } from './stats.service.js'

export function createStatsRouter(
  service: StatsService,
  currentUser: RequestHandler,
) {
  const router = Router()

  router.get(
    '/streaks',
    currentUser,
    async (req: Request, res: Response<StreakListResponse>) => {
      if (!req.userId) throw new Error('No current user on the request')
      res.json(await service.streaks(req.userId))
    },
  )

  return router
}
