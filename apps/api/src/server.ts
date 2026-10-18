import express from 'express'
import { pool } from './db.js'

const app = express()
const PORT = Number(process.env.PORT || 3000)

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
  console.log(`API listening on http://localhost:${PORT}`)
})
