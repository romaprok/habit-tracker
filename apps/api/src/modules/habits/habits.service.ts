import type { CreateHabit, Habit, UpdateHabit } from '@habit-tracker/shared'

import { toHabit } from './habits.mapper.js'
import type { HabitsRepository } from './habits.repository.js'
import { NotFoundError } from '../../errors/app-error.js'

const notFound = () => new NotFoundError('Habit not found')

export function createHabitsService(repository: HabitsRepository) {
  return {
    async listForUser(userId: string): Promise<Habit[]> {
      const rows = await repository.findByUserId(userId)
      return rows.map(toHabit)
    },

    async getForUser(userId: string, id: string): Promise<Habit> {
      const row = await repository.findOwned(id, userId)
      if (!row) throw notFound()
      return toHabit(row)
    },

    async create(userId: string, input: CreateHabit): Promise<Habit> {
      return toHabit(await repository.create(userId, input))
    },

    async update(
      userId: string,
      id: string,
      input: UpdateHabit,
    ): Promise<Habit> {
      const row = await repository.updateOwned(id, userId, input)
      if (!row) throw notFound()
      return toHabit(row)
    },

    async remove(userId: string, id: string): Promise<void> {
      const deleted = await repository.deleteOwned(id, userId)
      if (!deleted) throw notFound()
    },
  }
}

export type HabitsService = ReturnType<typeof createHabitsService>
