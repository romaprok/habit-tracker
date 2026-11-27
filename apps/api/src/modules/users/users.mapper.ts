import type { User } from '@habit-tracker/shared'

import type { UserRow } from './users.repository.js'

export function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    timezone: row.timezone,
    createdAt: row.createdAt.toISOString(),
  }
}
