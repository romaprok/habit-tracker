import { jwtVerify, SignJWT } from 'jose'

const ALGORITHM = 'HS256'

export const ACCESS_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60

export function createTokenService(secret: string) {
  const key = new TextEncoder().encode(secret)

  return {
    signAccessToken(userId: string): Promise<string> {
      return new SignJWT({})
        .setProtectedHeader({ alg: ALGORITHM })
        .setSubject(userId)
        .setIssuedAt()
        .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
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
