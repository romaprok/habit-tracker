import express from 'express'
import type { Pool } from 'pg'
import { pinoHttp } from 'pino-http'

import { logger } from './logger.js'
import { createHealthController } from './modules/health/health.controller.js'
import { createHealthRepository } from './modules/health/health.repository.js'
import { createHealthRouter } from './modules/health/health.router.js'
import { createHealthService } from './modules/health/health.service.js'

export type AppDeps = { pool: Pool }

export function createApp({ pool }: AppDeps) {
  const app = express()

  app.use(
    pinoHttp({
      logger,
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error'
        if (res.statusCode >= 400) return 'warn'
        return 'info'
      },
    }),
  )

  const healthRepository = createHealthRepository(pool)
  const healthService = createHealthService(healthRepository)
  const healthController = createHealthController(healthService)
  app.use('/api', createHealthRouter(healthController))

  return app
}
