import { createApp } from './app.js'
import { config } from './config.js'
import { createPool } from './db.js'
import { logger } from './logger.js'

const pool = createPool(config.DATABASE_URL)
const app = createApp({ pool })

app.listen(config.PORT, (error) => {
  if (error) throw error
  logger.info(`API listening on http://localhost:${config.PORT}`)
})
