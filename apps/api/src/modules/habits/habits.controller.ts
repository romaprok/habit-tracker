import type { Request, Response } from 'express'

import type { HabitListResponse } from '@habit-tracker/shared'

import type { HabitsService } from './habits.service.js'

export function createHabitsController(service: HabitsService) {
  return {
    async list(req: Request, res: Response<HabitListResponse>) {
      if (!req.userId) throw new Error('No current user on the request')

      const habits = await service.listForUser(req.userId)
      res.json({ habits })
    },
  }
}

export type HabitsController = ReturnType<typeof createHabitsController>
