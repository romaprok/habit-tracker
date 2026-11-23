import type { Request, Response } from 'express'

import type {
  CreateHabit,
  HabitListResponse,
  HabitResponse,
  UpdateHabit,
} from '@habit-tracker/shared'

import type { HabitsService } from './habits.service.js'

type IdParams = { id: string }

function currentUserId(req: { userId?: string }) {
  if (!req.userId) throw new Error('No current user on the request')
  return req.userId
}

export function createHabitsController(service: HabitsService) {
  return {
    async list(req: Request, res: Response<HabitListResponse>) {
      const habits = await service.listForUser(currentUserId(req))
      res.json({ habits })
    },

    async get(req: Request<IdParams>, res: Response<HabitResponse>) {
      const habit = await service.getForUser(currentUserId(req), req.params.id)
      res.json({ habit })
    },

    async create(req: Request, res: Response<HabitResponse>) {
      const input = req.body as CreateHabit
      const habit = await service.create(currentUserId(req), input)
      res.status(201).location(`/api/habits/${habit.id}`).json({ habit })
    },

    async update(req: Request<IdParams>, res: Response<HabitResponse>) {
      const input = req.body as UpdateHabit
      const habit = await service.update(
        currentUserId(req),
        req.params.id,
        input,
      )
      res.json({ habit })
    },

    async remove(req: Request<IdParams>, res: Response) {
      await service.remove(currentUserId(req), req.params.id)
      res.status(204).end()
    },
  }
}

export type HabitsController = ReturnType<typeof createHabitsController>
