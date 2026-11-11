import { asc, eq } from 'drizzle-orm'

import type { Db } from '../../db/client.js'
import { habits } from '../../db/schema.js'

export type HabitRow = typeof habits.$inferSelect

export function createHabitsRepository(db: Db) {
  return {
    async findByUserId(userId: string): Promise<HabitRow[]> {
      return db
        .select()
        .from(habits)
        .where(eq(habits.userId, userId))
        .orderBy(asc(habits.createdAt), asc(habits.id))
    },
  }
}

export type HabitsRepository = ReturnType<typeof createHabitsRepository>
