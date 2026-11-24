import { and, asc, between, eq } from 'drizzle-orm'

import type { Check } from '@habit-tracker/shared'

import type { Db } from '../../db/client.js'
import { habitChecks, habits } from '../../db/schema.js'

export function createChecksRepository(db: Db) {
  return {
    async add(habitId: string, date: string): Promise<void> {
      await db
        .insert(habitChecks)
        .values({ habitId, date })
        .onConflictDoNothing()
    },

    async remove(habitId: string, date: string): Promise<void> {
      await db
        .delete(habitChecks)
        .where(
          and(eq(habitChecks.habitId, habitId), eq(habitChecks.date, date)),
        )
    },

    async findInRange(
      userId: string,
      from: string,
      to: string,
    ): Promise<Check[]> {
      return db
        .select({ habitId: habitChecks.habitId, date: habitChecks.date })
        .from(habitChecks)
        .innerJoin(habits, eq(habits.id, habitChecks.habitId))
        .where(
          and(eq(habits.userId, userId), between(habitChecks.date, from, to)),
        )
        .orderBy(asc(habitChecks.date), asc(habitChecks.habitId))
    },
  }
}

export type ChecksRepository = ReturnType<typeof createChecksRepository>
