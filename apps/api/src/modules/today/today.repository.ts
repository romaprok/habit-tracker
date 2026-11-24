import { and, asc, eq, isNull } from 'drizzle-orm'

import type { Db } from '../../db/client.js'
import { habitChecks, habits } from '../../db/schema.js'

export function createTodayRepository(db: Db) {
  return {
    async findItems(userId: string, date: string) {
      return db
        .select({ habit: habits, checkId: habitChecks.id })
        .from(habits)
        .leftJoin(
          habitChecks,
          and(eq(habitChecks.habitId, habits.id), eq(habitChecks.date, date)),
        )
        .where(and(eq(habits.userId, userId), isNull(habits.archivedAt)))
        .orderBy(asc(habits.createdAt), asc(habits.id))
    },
  }
}

export type TodayRepository = ReturnType<typeof createTodayRepository>
