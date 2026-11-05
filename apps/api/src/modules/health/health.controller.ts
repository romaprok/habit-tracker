import type { Request, Response } from 'express'

import type { HealthService } from './health.service.js'

export function createHealthController(service: HealthService) {
  return {
    async getHealth(_req: Request, res: Response) {
      const report = await service.check()
      res.status(report.db === 'ok' ? 200 : 503).json(report)
    },
  }
}

export type HealthController = ReturnType<typeof createHealthController>
