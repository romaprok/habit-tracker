import { TEST_JWT_SECRET } from './test-app.js'
import { ACCESS_COOKIE } from '../modules/auth/cookies.js'
import { createTokenService } from '../modules/auth/tokens.js'

const tokens = createTokenService(TEST_JWT_SECRET)

export async function authCookie(userId: string) {
  return `${ACCESS_COOKIE}=${await tokens.signAccessToken(userId)}`
}
