import type { Request, Response } from 'express'

import type { GitHubClient } from './github.client.js'
import {
  clearStateCookie,
  generateState,
  setStateCookie,
  statesMatch,
  OAUTH_STATE_COOKIE,
} from './oauth-state.js'
import { OAuthSignInError, type OAuthService } from './oauth.service.js'
import { logger } from '../../logger.js'
import { setSessionCookies } from '../auth/cookies.js'
import type { SessionService } from '../auth/session.service.js'

type Deps = {
  github: GitHubClient | null
  oauth: OAuthService
  sessions: SessionService
  webUrl: string
  secureCookies: boolean
  accessTtlSeconds: number
}

export function createGitHubController({
  github,
  oauth,
  sessions,
  webUrl,
  secureCookies,
  accessTtlSeconds,
}: Deps) {
  function backToLogin(res: Response, error: string) {
    res.redirect(`${webUrl}/login?error=${error}`)
  }

  return {
    start(_req: Request, res: Response) {
      if (!github) {
        backToLogin(res, 'github_unavailable')
        return
      }
      const state = generateState()
      setStateCookie(res, state, secureCookies)
      res.redirect(github.authorizeUrl(state))
    },

    // Every failure ends with a redirect to the login page, not JSON:
    // the user arrives here in the browser's address bar, not via fetch.
    async callback(req: Request, res: Response) {
      const { code, state, error } = req.query
      const expectedState: unknown = req.cookies?.[OAUTH_STATE_COOKIE]
      clearStateCookie(res, secureCookies) // single use, whatever happens

      if (!github) return backToLogin(res, 'github_unavailable')
      if (error === 'access_denied') return backToLogin(res, 'github_denied')
      if (!statesMatch(state, expectedState)) {
        return backToLogin(res, 'github_state')
      }
      if (typeof code !== 'string') return backToLogin(res, 'github_failed')

      try {
        const token = await github.exchangeCode(code)
        const profile = await github.fetchProfile(token)
        const userId = await oauth.signInWithGitHub(profile)
        // From here on it is an ordinary session, same as after a password
        // login: requireAuth does not know how the user signed in.
        setSessionCookies(res, await sessions.start(userId), {
          secure: secureCookies,
          accessTtlSeconds,
        })
        res.redirect(`${webUrl}/`)
      } catch (err) {
        if (err instanceof OAuthSignInError) {
          return backToLogin(res, `github_${err.reason}`)
        }
        logger.warn({ err }, 'GitHub sign-in failed')
        backToLogin(res, 'github_failed')
      }
    },
  }
}

export type GitHubController = ReturnType<typeof createGitHubController>
