import type { ChecksRepository } from './checks.repository.js'
import { NotFoundError, ValidationError } from '../../errors/app-error.js'
import { todayIn } from '../../lib/dates.js'
import type { HabitsRepository } from '../habits/habits.repository.js'
import type { UsersRepository } from '../users/users.repository.js'

type Deps = {
  checks: ChecksRepository
  habits: HabitsRepository
  users: UsersRepository
}

export function createChecksService({ checks, habits, users }: Deps) {
  async function assertOwnedHabit(userId: string, habitId: string) {
    const habit = await habits.findOwned(habitId, userId)
    if (!habit) throw new NotFoundError('Habit not found')
  }

  async function userToday(userId: string) {
    const user = await users.findById(userId)
    if (!user) throw new Error(`User ${userId} not found`)
    return todayIn(user.timezone)
  }

  return {
    async check(userId: string, habitId: string, date: string): Promise<void> {
      await assertOwnedHabit(userId, habitId)
      if (date > (await userToday(userId))) {
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
