import { eq } from 'drizzle-orm'

import { config } from '../config.js'
import { createDb, createPool } from './client.js'
import { habits, users } from './schema.js'

const DEMO_EMAIL = 'demo@habit-tracker.local'

const pool = createPool(config.DATABASE_URL)
const db = createDb(pool)

try {
  await db.transaction(async (tx) => {
    const [demo] = await tx
      .insert(users)
      .values({ email: DEMO_EMAIL })
      .onConflictDoUpdate({ target: users.email, set: { email: DEMO_EMAIL } })
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
  console.log('Seed done')
} finally {
  await pool.end()
}
