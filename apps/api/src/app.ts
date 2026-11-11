import express from 'express'
import type { Pool } from 'pg'
import { pinoHttp } from 'pino-http'

import { createDb } from './db/client.js'
import { logger } from './logger.js'
import { createDemoUserMiddleware } from './middleware/demo-user.js'
import { createHabitsController } from './modules/habits/habits.controller.js'
import { createHabitsRepository } from './modules/habits/habits.repository.js'
import { createHabitsRouter } from './modules/habits/habits.router.js'
import { createHabitsService } from './modules/habits/habits.service.js'
import { createHealthController } from './modules/health/health.controller.js'
import { createHealthRepository } from './modules/health/health.repository.js'
import { createHealthRouter } from './modules/health/health.router.js'
import { createHealthService } from './modules/health/health.service.js'
import { createUsersRepository } from './modules/users/users.repository.js'

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
  const db = createDb(pool)
  const demoUser = createDemoUserMiddleware(createUsersRepository(db))
  const habitsController = createHabitsController(
    createHabitsService(createHabitsRepository(db)),
  )
  app.use('/api', createHabitsRouter(habitsController, demoUser))
  return app
}
