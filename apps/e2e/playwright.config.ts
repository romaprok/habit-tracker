import { existsSync } from 'node:fs'

import { defineConfig, devices } from '@playwright/test'

// Local runs read the developer's .env; CI passes the variables directly.
if (existsSync('../../.env')) process.loadEnvFile('../../.env')

// Own ports and an own database, so e2e can run next to `npm run dev`
// and never touches the development data.
const API_PORT = 3100
const WEB_PORT = 5180
const WEB_URL = `http://localhost:${WEB_PORT}`

function e2eDatabaseUrl() {
  const base = process.env.DATABASE_URL
  if (!base) throw new Error('DATABASE_URL is not set')
  const url = new URL(base)
  url.pathname = '/habit_tracker_e2e'
  return url.toString()
}

export const E2E_DATABASE_URL = e2eDatabaseUrl()

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: WEB_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // The real API and the real Vite dev server, wired like in development:
  // the browser talks to Vite, Vite proxies /api to the API.
  webServer: [
    {
      name: 'api',
      command: 'node --import tsx src/server.ts',
      cwd: '../api',
      // Not /api/health: web servers start before globalSetup creates the
      // database, and health would answer 503. A 401 from /me already
      // proves the API is listening (Playwright counts 401 as ready).
      url: `http://localhost:${API_PORT}/api/auth/me`,
      reuseExistingServer: false,
      env: {
        PORT: String(API_PORT),
        DATABASE_URL: E2E_DATABASE_URL,
        JWT_SECRET:
          process.env.JWT_SECRET ?? 'e2e-only-jwt-secret-0123456789abcdef',
        ALLOWED_ORIGINS: WEB_URL,
        WEB_URL,
        LOG_LEVEL: 'warn',
      },
    },
    {
      name: 'web',
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      cwd: '../web',
      url: WEB_URL,
      reuseExistingServer: false,
      // vite.config.ts points the /api proxy at PORT.
      env: { PORT: String(API_PORT) },
    },
  ],
})
