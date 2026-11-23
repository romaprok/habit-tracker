import { and, asc, eq } from 'drizzle-orm'

import type { CreateHabit, UpdateHabit } from '@habit-tracker/shared'

import type { Db } from '../../db/client.js'
import { habits } from '../../db/schema.js'

export type HabitRow = typeof habits.$inferSelect

function ownedBy(id: string, userId: string) {
  return and(eq(habits.id, id), eq(habits.userId, userId))
}

export function createHabitsRepository(db: Db) {
  return {
    async findByUserId(userId: string): Promise<HabitRow[]> {
      return db
        .select()
        .from(habits)
        .where(eq(habits.userId, userId))
        .orderBy(asc(habits.createdAt), asc(habits.id))
    },

    async findOwned(id: string, userId: string): Promise<HabitRow | null> {
      const [row] = await db.select().from(habits).where(ownedBy(id, userId))
      return row ?? null
    },

    async create(userId: string, input: CreateHabit): Promise<HabitRow> {
      const [row] = await db
        .insert(habits)
        .values({ ...input, userId })
        .returning()
      return row
    },

    async updateOwned(
      id: string,
      userId: string,
      input: UpdateHabit,
    ): Promise<HabitRow | null> {
      const [row] = await db
        .update(habits)
        .set(input)
        .where(ownedBy(id, userId))
        .returning()
      return row ?? null
    },

    async deleteOwned(id: string, userId: string): Promise<boolean> {
      const deleted = await db
        .delete(habits)
        .where(ownedBy(id, userId))
        .returning({ id: habits.id })
      return deleted.length > 0
    },
  }
}

export type HabitsRepository = ReturnType<typeof createHabitsRepository>
