import { eq } from 'drizzle-orm'

import type { Db } from '../../db/client.js'
import { users } from '../../db/schema.js'

export function createUsersRepository(db: Db) {
  return {
    async findByEmail(email: string) {
      const [user] = await db.select().from(users).where(eq(users.email, email))
      return user ?? null
    },

    async findById(id: string) {
      const [user] = await db.select().from(users).where(eq(users.id, id))
      return user ?? null
    },
  }
}

export type UsersRepository = ReturnType<typeof createUsersRepository>
