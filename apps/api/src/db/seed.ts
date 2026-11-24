import { eq } from 'drizzle-orm'

import { config } from '../config.js'
import { createDb, createPool } from './client.js'
import { DEMO_USER_EMAIL as DEMO_EMAIL } from './demo.js'
import { habits, users } from './schema.js'
import { hashPassword } from '../lib/passwords.js'

const DEMO_TIMEZONE = 'Europe/Kyiv'
const DEMO_PASSWORD = 'demo-password'

const pool = createPool(config.DATABASE_URL)
const db = createDb(pool)

const passwordHash = await hashPassword(DEMO_PASSWORD)

try {
  await db.transaction(async (tx) => {
    const [demo] = await tx
      .insert(users)
      .values({ email: DEMO_EMAIL, timezone: DEMO_TIMEZONE, passwordHash })
      .onConflictDoUpdate({
        target: users.email,
        set: { timezone: DEMO_TIMEZONE, passwordHash },
      })
      .returning()

    await tx.delete(habits).where(eq(habits.userId, demo.id))
    await tx.insert(habits).values([
      { userId: demo.id, name: 'Read 20 minutes', color: '#3B82F6' },
      {
        userId: demo.id,
        name: 'Workout',
        description: 'Gym or a run',
        color: '#22C55E',
      },
      { userId: demo.id, name: 'No sugar', color: '#F97316' },
      { userId: demo.id, name: 'Meditate', color: '#A855F7' },
    ])
  })
  console.log(`Seed done. Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`)
} finally {
  await pool.end()
}
