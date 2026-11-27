import { and, eq, gt, isNull } from 'drizzle-orm'

import type { Db, DbOrTx } from '../../db/client.js'
import { refreshTokens } from '../../db/schema.js'

type NewRefreshToken = { userId: string; tokenHash: string; expiresAt: Date }

function queries(db: DbOrTx) {
  return {
    async create(input: NewRefreshToken) {
      await db.insert(refreshTokens).values(input)
    },

    // One atomic UPDATE: of two concurrent requests with the same token,
    // only one gets a row back, so a token can be exchanged only once.
    async consume(tokenHash: string, now: Date) {
      const [row] = await db
        .update(refreshTokens)
        .set({ usedAt: now })
        .where(
          and(
            eq(refreshTokens.tokenHash, tokenHash),
            isNull(refreshTokens.usedAt),
            gt(refreshTokens.expiresAt, now),
          ),
        )
        .returning({ userId: refreshTokens.userId })
      return row ?? null
    },

    async findByHash(tokenHash: string) {
      const [row] = await db
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.tokenHash, tokenHash))
      return row ?? null
    },

    async deleteAllForUser(userId: string) {
      await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId))
    },
  }
}

export type RefreshTokensQueries = ReturnType<typeof queries>

export function createRefreshTokensRepository(db: Db) {
  return {
    ...queries(db),

    transaction<T>(work: (repo: RefreshTokensQueries) => Promise<T>) {
      return db.transaction((tx) => work(queries(tx)))
    },
  }
}

export type RefreshTokensRepository = ReturnType<
  typeof createRefreshTokensRepository
>
