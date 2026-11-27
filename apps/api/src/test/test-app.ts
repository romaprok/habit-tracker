import type { Pool } from 'pg'

import { createApp, type AppDeps } from '../app.js'

export const TEST_JWT_SECRET = 'test-only-jwt-secret-0123456789abcdef'

// Most tests sign in many times from one "IP": the real limit would get in
// the way, so it is raised here and tested on its own with small numbers.
const NO_RATE_LIMIT = { limit: 1_000_000, windowMs: 60_000 }

export function createTestApp(pool: Pool, overrides: Partial<AppDeps> = {}) {
  return createApp({
    pool,
    jwtSecret: TEST_JWT_SECRET,
    secureCookies: false,
    authRateLimit: NO_RATE_LIMIT,
    ...overrides,
  })
}
