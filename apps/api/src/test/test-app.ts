import type { Pool } from 'pg'

import { createApp } from '../app.js'

export const TEST_JWT_SECRET = 'test-only-jwt-secret-0123456789abcdef'

export function createTestApp(pool: Pool) {
  return createApp({ pool, jwtSecret: TEST_JWT_SECRET, secureCookies: false })
}
