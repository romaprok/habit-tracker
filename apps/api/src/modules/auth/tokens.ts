import { jwtVerify, SignJWT } from 'jose'

const ALGORITHM = 'HS256'

export const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 15 * 60

export function createTokenService(
  secret: string,
  accessTtlSeconds = DEFAULT_ACCESS_TOKEN_TTL_SECONDS,
) {
  const key = new TextEncoder().encode(secret)

  return {
    accessTtlSeconds,

    signAccessToken(userId: string): Promise<string> {
      return new SignJWT({})
        .setProtectedHeader({ alg: ALGORITHM })
        .setSubject(userId)
        .setIssuedAt()
        .setExpirationTime(`${accessTtlSeconds}s`)
        .sign(key)
    },

    async verifyAccessToken(token: string): Promise<string | null> {
      try {
        const { payload } = await jwtVerify(token, key, {
          algorithms: [ALGORITHM],
        })
        return typeof payload.sub === 'string' ? payload.sub : null
      } catch {
        return null
      }
    },
  }
}

export type TokenService = ReturnType<typeof createTokenService>
