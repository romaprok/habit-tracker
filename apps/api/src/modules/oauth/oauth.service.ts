import type { GitHubEmail, GitHubProfile } from './github.client.js'
import type { OAuthAccountsRepository } from './oauth-accounts.repository.js'
import { isUniqueViolation } from '../../lib/db-errors.js'
import type { UsersRepository } from '../users/users.repository.js'

type Deps = { accounts: OAuthAccountsRepository; users: UsersRepository }

export type OAuthFailure = 'no_verified_email' | 'conflict'

export class OAuthSignInError extends Error {
  readonly reason: OAuthFailure

  constructor(reason: OAuthFailure) {
    super(`OAuth sign-in failed: ${reason}`)
    this.reason = reason
    this.name = 'OAuthSignInError'
  }
}

// Only an address GitHub has verified proves the person owns it. Linking by
// an unverified one would let anyone add a victim's email to their GitHub
// account and walk into the victim's account here.
export function pickVerifiedEmail(emails: GitHubEmail[]): string | null {
  const verified = emails.filter((e) => e.verified)
  const chosen = verified.find((e) => e.primary) ?? verified[0]
  return chosen ? chosen.email.trim().toLowerCase() : null
}

export function createOAuthService({ accounts, users }: Deps) {
  return {
    // Returns our user id. Order matters:
    // 1) a known GitHub account wins, even if its emails changed since;
    // 2) otherwise link to an existing user with the same verified email;
    // 3) otherwise create a new user (without a password).
    async signInWithGitHub(profile: GitHubProfile): Promise<string> {
      const key = { provider: 'github', providerUserId: profile.id } as const

      const linkedUserId = await accounts.findUserId(key)
      if (linkedUserId) return linkedUserId

      const email = pickVerifiedEmail(profile.emails)
      if (!email) throw new OAuthSignInError('no_verified_email')

      try {
        const existing = await users.findByEmail(email)
        if (existing) {
          await accounts.link(existing.id, key)
          return existing.id
        }
        return await accounts.createUserWithAccount(email, key)
      } catch (err) {
        // The user already has another GitHub account linked, or a parallel
        // request has just created the same user.
        if (isUniqueViolation(err)) throw new OAuthSignInError('conflict')
        throw err
      }
    },
  }
}

export type OAuthService = ReturnType<typeof createOAuthService>
