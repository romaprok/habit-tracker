import cookieParser from 'cookie-parser'
import express, { json } from 'express'
import helmet from 'helmet'
import type { Pool } from 'pg'
import { pinoHttp } from 'pino-http'

import { createDb } from './db/client.js'
import { logger } from './logger.js'
import { createCheckOrigin } from './middleware/check-origin.js'
import { errorHandler } from './middleware/error-handler.js'
import { notFound } from './middleware/not-found.js'
import {
  AUTH_RATE_LIMIT,
  type RateLimitOptions,
} from './middleware/rate-limit.js'
import { createRequireAuth } from './middleware/require-auth.js'
import { createAuthController } from './modules/auth/auth.controller.js'
import { createAuthRouter } from './modules/auth/auth.router.js'
import { createAuthService } from './modules/auth/auth.service.js'
import { createRefreshTokensRepository } from './modules/auth/refresh-tokens.repository.js'
import { createSessionService } from './modules/auth/session.service.js'
import { createTokenService } from './modules/auth/tokens.js'
import { createChecksController } from './modules/checks/checks.controller.js'
import { createChecksRepository } from './modules/checks/checks.repository.js'
import { createChecksRouter } from './modules/checks/checks.router.js'
import { createChecksService } from './modules/checks/checks.service.js'
import { createHabitsController } from './modules/habits/habits.controller.js'
import { createHabitsRepository } from './modules/habits/habits.repository.js'
import { createHabitsRouter } from './modules/habits/habits.router.js'
import { createHabitsService } from './modules/habits/habits.service.js'
import { createHealthController } from './modules/health/health.controller.js'
import { createHealthRepository } from './modules/health/health.repository.js'
import { createHealthRouter } from './modules/health/health.router.js'
import { createHealthService } from './modules/health/health.service.js'
import type { GitHubClient } from './modules/oauth/github.client.js'
import { createGitHubController } from './modules/oauth/github.controller.js'
import { createGitHubRouter } from './modules/oauth/github.router.js'
import { createOAuthAccountsRepository } from './modules/oauth/oauth-accounts.repository.js'
import { createOAuthService } from './modules/oauth/oauth.service.js'
import { createStatsRepository } from './modules/stats/stats.repository.js'
import { createStatsRouter } from './modules/stats/stats.router.js'
import { createStatsService } from './modules/stats/stats.service.js'
import { createTodayRepository } from './modules/today/today.repository.js'
import { createTodayRouter } from './modules/today/today.router.js'
import { createTodayService } from './modules/today/today.service.js'
import { createUsersRepository } from './modules/users/users.repository.js'
import { createUsersService } from './modules/users/users.service.js'

export type AppDeps = {
  pool: Pool
  jwtSecret: string
  secureCookies: boolean
  accessTokenTtlSeconds?: number
  authRateLimit?: RateLimitOptions
  allowedOrigins?: string[]
  // null: GitHub sign-in is not configured.
  github?: GitHubClient | null
  // Where the web app lives: OAuth redirects send the browser back there.
  webUrl?: string
}

const DEV_WEB_URL = 'http://localhost:5173'
const DEV_ORIGINS = [DEV_WEB_URL]

export function createApp({
  pool,
  jwtSecret,
  secureCookies,
  accessTokenTtlSeconds,
  authRateLimit = AUTH_RATE_LIMIT,
  allowedOrigins = DEV_ORIGINS,
  github = null,
  webUrl = DEV_WEB_URL,
}: AppDeps) {
  const app = express()

  // Security headers (nosniff, frame-ancestors, HSTS…) and no X-Powered-By.
  app.use(helmet())

  app.use(json())
  app.use(cookieParser())
  app.use('/api', createCheckOrigin(allowedOrigins))

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
  const usersRepository = createUsersRepository(db)
  const habitsRepository = createHabitsRepository(db)
  const usersService = createUsersService(usersRepository)

  const tokens = createTokenService(jwtSecret, accessTokenTtlSeconds)
  const sessions = createSessionService({
    tokens,
    refreshTokens: createRefreshTokensRepository(db),
  })
  const authController = createAuthController({
    service: createAuthService({ users: usersRepository }),
    sessions,
    accessTtlSeconds: tokens.accessTtlSeconds,
    secureCookies,
  })
  const requireAuth = createRequireAuth(tokens)
  app.use('/api', createAuthRouter(authController, requireAuth, authRateLimit))

  const githubController = createGitHubController({
    github,
    oauth: createOAuthService({
      accounts: createOAuthAccountsRepository(db),
      users: usersRepository,
    }),
    sessions,
    webUrl,
    secureCookies,
    accessTtlSeconds: tokens.accessTtlSeconds,
  })
  app.use('/api', createGitHubRouter(githubController))

  const habitsController = createHabitsController(
    createHabitsService(habitsRepository),
  )
  app.use('/api', createHabitsRouter(habitsController, requireAuth))

  const checksController = createChecksController(
    createChecksService({
      checks: createChecksRepository(db),
      habits: habitsRepository,
      users: usersService,
    }),
  )
  app.use('/api', createChecksRouter(checksController, requireAuth))

  const todayService = createTodayService({
    today: createTodayRepository(db),
    users: usersService,
  })
  app.use('/api', createTodayRouter(todayService, requireAuth))

  const statsService = createStatsService({
    stats: createStatsRepository(db),
    users: usersService,
  })
  app.use('/api', createStatsRouter(statsService, requireAuth))

  app.use(notFound)
  app.use(errorHandler)

  return app
}
