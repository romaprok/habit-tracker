import {
  generateRefreshToken,
  hashRefreshToken,
  REFRESH_TOKEN_TTL_SECONDS,
} from './refresh-tokens.js'
import type {
  RefreshTokensQueries,
  RefreshTokensRepository,
} from './refresh-tokens.repository.js'
import type { TokenService } from './tokens.js'
import { UnauthorizedError } from '../../errors/app-error.js'
import { logger } from '../../logger.js'

type Deps = {
  tokens: TokenService
  refreshTokens: RefreshTokensRepository
  now?: () => Date
}

export type Session = { accessToken: string; refreshToken: string }

const SESSION_EXPIRED = 'Session expired, please log in again'

export function createSessionService({
  tokens,
  refreshTokens,
  now = () => new Date(),
}: Deps) {
  async function storeNewRefreshToken(
    repo: RefreshTokensQueries,
    userId: string,
  ) {
    const refreshToken = generateRefreshToken()
    await repo.create({
      userId,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(now().getTime() + REFRESH_TOKEN_TTL_SECONDS * 1000),
    })
    return refreshToken
  }

  return {
    async start(userId: string): Promise<Session> {
      const refreshToken = await storeNewRefreshToken(refreshTokens, userId)
      return { accessToken: await tokens.signAccessToken(userId), refreshToken }
    },

    // Logout: this device's refresh token stops working right away.
    // The access token still lives up to its short TTL — that is the trade-off
    // of a stateless JWT, and why it is short.
    async end(refreshToken: string) {
      await refreshTokens.deleteByHash(hashRefreshToken(refreshToken))
    },

    // Rotation: the old refresh token is marked used and a new one is stored
    // in the same transaction — either both happen or neither does.
    async refresh(oldToken: string): Promise<Session> {
      const tokenHash = hashRefreshToken(oldToken)

      const rotated = await refreshTokens.transaction(async (repo) => {
        const consumed = await repo.consume(tokenHash, now())
        if (!consumed) return null
        const refreshToken = await storeNewRefreshToken(repo, consumed.userId)
        return { userId: consumed.userId, refreshToken }
      })

      if (!rotated) {
        const known = await refreshTokens.findByHash(tokenHash)
        if (known?.usedAt) {
          // A token that was already exchanged came back: someone else has a
          // copy. We cannot tell who is the real user, so end every session.
          logger.warn(
            { userId: known.userId },
            'Refresh token reuse detected, revoking all sessions',
          )
          await refreshTokens.deleteAllForUser(known.userId)
        }
        throw new UnauthorizedError(SESSION_EXPIRED)
      }

      return {
        accessToken: await tokens.signAccessToken(rotated.userId),
        refreshToken: rotated.refreshToken,
      }
    },
  }
}

export type SessionService = ReturnType<typeof createSessionService>
