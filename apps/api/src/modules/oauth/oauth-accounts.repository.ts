import { and, eq } from 'drizzle-orm'

import type { Db } from '../../db/client.js'
import { oauthAccounts, users } from '../../db/schema.js'

export type OAuthProvider = 'github'

type AccountKey = { provider: OAuthProvider; providerUserId: string }

export function createOAuthAccountsRepository(db: Db) {
  return {
    async findUserId({ provider, providerUserId }: AccountKey) {
      const [row] = await db
        .select({ userId: oauthAccounts.userId })
        .from(oauthAccounts)
        .where(
          and(
            eq(oauthAccounts.provider, provider),
            eq(oauthAccounts.providerUserId, providerUserId),
          ),
        )
      return row?.userId ?? null
    },

    async link(userId: string, key: AccountKey) {
      await db.insert(oauthAccounts).values({ userId, ...key })
    },

    // A user without a linked account must never exist, nor an account
    // without a user: both rows go in one transaction.
    async createUserWithAccount(email: string, key: AccountKey) {
      return db.transaction(async (tx) => {
        const [user] = await tx
          .insert(users)
          .values({ email })
          .returning({ id: users.id })
        await tx.insert(oauthAccounts).values({ userId: user.id, ...key })
        return user.id
      })
    },
  }
}

export type OAuthAccountsRepository = ReturnType<
  typeof createOAuthAccountsRepository
>
