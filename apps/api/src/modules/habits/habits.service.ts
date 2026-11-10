import type { Habit } from '@habit-tracker/shared'

import { toHabit } from './habits.mapper.js'
import type { HabitsRepository } from './habits.repository.js'

export function createHabitsService(repository: HabitsRepository) {
  return {
    async listForUser(userId: string): Promise<Habit[]> {
      const rows = await repository.findByUserId(userId)
      return rows.map(toHabit)
    },
  }
}

export type HabitsService = ReturnType<typeof createHabitsService>
