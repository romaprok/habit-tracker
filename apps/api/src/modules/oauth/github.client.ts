// Adapter over GitHub's OAuth endpoints: the rest of the app works with
// "authorize URL", "exchange code", "profile" and never sees GitHub's URLs,
// headers or response shapes. Tests swap it for a fake.

const AUTHORIZE_URL = 'https://github.com/login/oauth/authorize'

// read:user — public profile, user:email — the list of emails with the
// "verified" flag, which we need to link accounts safely.
const SCOPES = 'read:user user:email'

export type GitHubConfig = {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export function createGitHubClient({ clientId, redirectUri }: GitHubConfig) {
  return {
    authorizeUrl(state: string): string {
      const url = new URL(AUTHORIZE_URL)
      url.search = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: SCOPES,
        state,
        allow_signup: 'true',
      }).toString()
      return url.toString()
    },
  }
}

export type GitHubClient = ReturnType<typeof createGitHubClient>
