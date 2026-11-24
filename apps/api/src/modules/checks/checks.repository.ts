import { and, eq } from 'drizzle-orm'

import type { Db } from '../../db/client.js'
import { habitChecks } from '../../db/schema.js'

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
  }
}

export type ChecksRepository = ReturnType<typeof createChecksRepository>
