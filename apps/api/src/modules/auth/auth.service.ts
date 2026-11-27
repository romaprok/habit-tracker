import type { Login, Register, User } from '@habit-tracker/shared'

import { ConflictError, UnauthorizedError } from '../../errors/app-error.js'
import { isUniqueViolation } from '../../lib/db-errors.js'
import { hashPassword, verifyPassword } from '../../lib/passwords.js'
import { toUser } from '../users/users.mapper.js'
import type { UsersRepository } from '../users/users.repository.js'

type Deps = { users: UsersRepository }

const INVALID_CREDENTIALS = 'Invalid email or password'

let dummyHash: Promise<string> | undefined

function getDummyHash() {
  dummyHash ??= hashPassword('dummy password used to equalize login timing')
  return dummyHash
}

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

    async getUser(id: string): Promise<User> {
      const user = await users.findById(id)
      if (!user) throw new UnauthorizedError()
      return toUser(user)
    },

    async login({ email, password }: Login): Promise<User> {
      const user = await users.findByEmail(email)
      const hash = user?.passwordHash ?? (await getDummyHash())
      const valid = await verifyPassword(hash, password)

      if (!user?.passwordHash || !valid) {
        throw new UnauthorizedError(INVALID_CREDENTIALS)
      }
      return toUser(user)
    },
  }
}

export type AuthService = ReturnType<typeof createAuthService>
