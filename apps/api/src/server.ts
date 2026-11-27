import { createApp } from './app.js'
import { config } from './config.js'
import { createPool } from './db/client.js'
import { logger } from './logger.js'
import { createGitHubClient } from './modules/oauth/github.client.js'

const pool = createPool(config.DATABASE_URL)

const github =
  config.GITHUB_CLIENT_ID && config.GITHUB_CLIENT_SECRET
    ? createGitHubClient({
        clientId: config.GITHUB_CLIENT_ID,
        clientSecret: config.GITHUB_CLIENT_SECRET,
        redirectUri: `${config.WEB_URL}/api/auth/github/callback`,
      })
    : null
const app = createApp({
  pool,
  jwtSecret: config.JWT_SECRET,
  secureCookies: config.NODE_ENV === 'production',
  accessTokenTtlSeconds: config.ACCESS_TOKEN_TTL_SECONDS,
  allowedOrigins: config.ALLOWED_ORIGINS,
  github,
  webUrl: config.WEB_URL,
})

app.listen(config.PORT, (error) => {
  if (error) throw error
  logger.info(`API listening on http://localhost:${config.PORT}`)
})
