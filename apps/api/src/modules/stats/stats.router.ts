import {
  Router,
  type Request,
  type RequestHandler,
  type Response,
} from 'express'
import { z } from 'zod'

import type {
  HabitStatsResponse,
  StreakListResponse,
} from '@habit-tracker/shared'

import type { StatsService } from './stats.service.js'
import { validate } from '../../middleware/validate.js'

const idParams = z.object({ id: z.uuid() })

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

  router.get(
    '/habits/:id/stats',
    validate({ params: idParams }),
    currentUser,
    async (req: Request<{ id: string }>, res: Response<HabitStatsResponse>) => {
      if (!req.userId) throw new Error('No current user on the request')
      res.json({ stats: await service.forHabit(req.userId, req.params.id) })
    },
  )

  return router
}
