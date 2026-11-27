import { createApp } from './app.js'
import { config } from './config.js'
import { createPool } from './db/client.js'
import { logger } from './logger.js'

const pool = createPool(config.DATABASE_URL)
const app = createApp({
  pool,
  jwtSecret: config.JWT_SECRET,
  secureCookies: config.NODE_ENV === 'production',
  accessTokenTtlSeconds: config.ACCESS_TOKEN_TTL_SECONDS,
  allowedOrigins: config.ALLOWED_ORIGINS,
})

app.listen(config.PORT, (error) => {
  if (error) throw error
  logger.info(`API listening on http://localhost:${config.PORT}`)
})
