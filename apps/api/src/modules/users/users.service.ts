import type { UsersRepository } from './users.repository.js'
import { todayIn } from '../../lib/dates.js'

export function createUsersService(users: UsersRepository) {
  return {
    async todayFor(userId: string): Promise<string> {
      const user = await users.findById(userId)
      if (!user) throw new Error(`User ${userId} not found`)
      return todayIn(user.timezone)
    },
  }
}

export type UsersService = ReturnType<typeof createUsersService>
