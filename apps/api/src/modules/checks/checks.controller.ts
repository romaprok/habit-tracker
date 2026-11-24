import type { Request, Response } from 'express'

import type { CheckListResponse, ChecksQuery } from '@habit-tracker/shared'

import type { ChecksService } from './checks.service.js'

type CheckParams = { id: string; date: string }

function currentUserId(req: { userId?: string }) {
  if (!req.userId) throw new Error('No current user on the request')
  return req.userId
}

export function createChecksController(service: ChecksService) {
  return {
    async list(
      req: Request<object, CheckListResponse, unknown, ChecksQuery>,
      res: Response<CheckListResponse>,
    ) {
      const { from, to } = req.query
      const checks = await service.listInRange(currentUserId(req), from, to)
      res.json({ checks })
    },

    async check(req: Request<CheckParams>, res: Response) {
      await service.check(currentUserId(req), req.params.id, req.params.date)
      res.status(204).end()
    },

    async uncheck(req: Request<CheckParams>, res: Response) {
      await service.uncheck(currentUserId(req), req.params.id, req.params.date)
      res.status(204).end()
    },
  }
}

export type ChecksController = ReturnType<typeof createChecksController>
