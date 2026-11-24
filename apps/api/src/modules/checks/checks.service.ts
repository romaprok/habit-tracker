import type { ChecksRepository } from './checks.repository.js'
import { NotFoundError, ValidationError } from '../../errors/app-error.js'
import type { HabitsRepository } from '../habits/habits.repository.js'
import type { UsersService } from '../users/users.service.js'

type Deps = {
  checks: ChecksRepository
  habits: HabitsRepository
  users: UsersService
}

export function createChecksService({ checks, habits, users }: Deps) {
  async function assertOwnedHabit(userId: string, habitId: string) {
    const habit = await habits.findOwned(habitId, userId)
    if (!habit) throw new NotFoundError('Habit not found')
  }

  return {
    async check(userId: string, habitId: string, date: string): Promise<void> {
      await assertOwnedHabit(userId, habitId)
      if (date > (await users.todayFor(userId))) {
        throw new ValidationError({
          'params.date': ['Date cannot be in the future'],
        })
      }
      await checks.add(habitId, date)
    },

    async uncheck(
      userId: string,
      habitId: string,
      date: string,
    ): Promise<void> {
      await assertOwnedHabit(userId, habitId)
      await checks.remove(habitId, date)
    },
  }
}

export type ChecksService = ReturnType<typeof createChecksService>
