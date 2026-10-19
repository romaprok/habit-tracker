import express from 'express'
import { pinoHttp } from 'pino-http'
import { logger } from './logger.js'
import { pool } from './db.js'
import { config } from './config.js'

const app = express()
const PORT = config.PORT

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

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ api: 'ok', db: 'ok' })
  } catch {
    res.status(503).json({ api: 'ok', db: 'error' })
  }
})

app.listen(PORT, (error) => {
  if (error) throw error
  logger.info(`API listening on http://localhost:${PORT}`)
})
