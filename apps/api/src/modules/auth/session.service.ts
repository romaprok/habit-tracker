import {
  generateRefreshToken,
  hashRefreshToken,
  REFRESH_TOKEN_TTL_SECONDS,
} from './refresh-tokens.js'
import type { RefreshTokensRepository } from './refresh-tokens.repository.js'
import type { TokenService } from './tokens.js'

type Deps = {
  tokens: TokenService
  refreshTokens: RefreshTokensRepository
  now?: () => Date
}

export type Session = { accessToken: string; refreshToken: string }

export function createSessionService({
  tokens,
  refreshTokens,
  now = () => new Date(),
}: Deps) {
  return {
    async start(userId: string): Promise<Session> {
      const refreshToken = generateRefreshToken()
      await refreshTokens.create({
        userId,
        tokenHash: hashRefreshToken(refreshToken),
        expiresAt: new Date(now().getTime() + REFRESH_TOKEN_TTL_SECONDS * 1000),
      })
      return { accessToken: await tokens.signAccessToken(userId), refreshToken }
    },
  }
}

export type SessionService = ReturnType<typeof createSessionService>
