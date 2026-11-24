import type { Request, Response } from 'express'

import type { ChecksService } from './checks.service.js'

type CheckParams = { id: string; date: string }

function currentUserId(req: { userId?: string }) {
  if (!req.userId) throw new Error('No current user on the request')
  return req.userId
}

export function createChecksController(service: ChecksService) {
  return {
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
