import type { Habit } from '@habit-tracker/shared'

import type { HabitRow } from './habits.repository.js'

export function toHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    color: row.color,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }
}
