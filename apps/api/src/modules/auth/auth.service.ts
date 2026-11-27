import type { Register, User } from '@habit-tracker/shared'

import { ConflictError } from '../../errors/app-error.js'
import { isUniqueViolation } from '../../lib/db-errors.js'
import { hashPassword } from '../../lib/passwords.js'
import { toUser } from '../users/users.mapper.js'
import type { UsersRepository } from '../users/users.repository.js'

type Deps = { users: UsersRepository }

export function createAuthService({ users }: Deps) {
  return {
    async register({ email, password, timezone }: Register): Promise<User> {
      const passwordHash = await hashPassword(password)
      try {
        return toUser(await users.create({ email, passwordHash, timezone }))
      } catch (err) {
        if (!isUniqueViolation(err)) throw err
        throw new ConflictError('Email is already registered', {
          email: ['An account with this email already exists'],
        })
      }
    },
  }
}

export type AuthService = ReturnType<typeof createAuthService>
