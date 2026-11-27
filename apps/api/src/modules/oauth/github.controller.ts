import type { Request, Response } from 'express'

import type { GitHubClient } from './github.client.js'
import { generateState, setStateCookie } from './oauth-state.js'

type Deps = {
  github: GitHubClient | null
  webUrl: string
  secureCookies: boolean
}

export function createGitHubController({
  github,
  webUrl,
  secureCookies,
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
  }
}

export type GitHubController = ReturnType<typeof createGitHubController>
