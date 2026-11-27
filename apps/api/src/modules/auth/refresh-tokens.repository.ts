import type { Db } from '../../db/client.js'
import { refreshTokens } from '../../db/schema.js'

type NewRefreshToken = { userId: string; tokenHash: string; expiresAt: Date }

export function createRefreshTokensRepository(db: Db) {
  return {
    async create(input: NewRefreshToken) {
      await db.insert(refreshTokens).values(input)
    },
  }
}

export type RefreshTokensRepository = ReturnType<
  typeof createRefreshTokensRepository
>
