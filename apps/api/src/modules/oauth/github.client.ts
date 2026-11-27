import { z } from 'zod'

// Adapter over GitHub's OAuth endpoints: the rest of the app works with
// "authorize URL", "exchange code", "profile" and never sees GitHub's URLs,
// headers or response shapes. Tests swap it for a fake.

const AUTHORIZE_URL = 'https://github.com/login/oauth/authorize'
const TOKEN_URL = 'https://github.com/login/oauth/access_token'
const API_URL = 'https://api.github.com'

// read:user — public profile, user:email — the list of emails with the
// "verified" flag, which we need to link accounts safely.
const SCOPES = 'read:user user:email'

const TIMEOUT_MS = 5000

const TokenResponseSchema = z.union([
  z.object({ access_token: z.string().min(1) }),
  z.object({ error: z.string(), error_description: z.string().optional() }),
])

const UserSchema = z.object({ id: z.number().int(), login: z.string() })

const EmailsSchema = z.array(
  z.object({
    email: z.string(),
    primary: z.boolean(),
    verified: z.boolean(),
  }),
)

export type GitHubEmail = z.infer<typeof EmailsSchema>[number]

export type GitHubProfile = {
  // GitHub's numeric id as a string: it never changes, unlike login or email.
  id: string
  login: string
  emails: GitHubEmail[]
}

export class GitHubError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'GitHubError'
  }
}

export type GitHubConfig = {
  clientId: string
  clientSecret: string
  redirectUri: string
  fetch?: typeof fetch
}

export function createGitHubClient({
  clientId,
  clientSecret,
  redirectUri,
  fetch: fetchImpl = fetch,
}: GitHubConfig) {
  async function call<T>(
    url: string,
    init: RequestInit,
    schema: z.ZodType<T>,
  ): Promise<T> {
    let res: Response
    try {
      res = await fetchImpl(url, {
        ...init,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
    } catch (err) {
      throw new GitHubError(`GitHub is unreachable: ${url}`, { cause: err })
    }
    if (!res.ok) {
      throw new GitHubError(`GitHub answered ${res.status} for ${url}`)
    }
    const parsed = schema.safeParse(await res.json().catch(() => undefined))
    if (!parsed.success) {
      throw new GitHubError(`Unexpected GitHub response from ${url}`)
    }
    return parsed.data
  }

  function apiGet<T>(path: string, token: string, schema: z.ZodType<T>) {
    return call(
      `${API_URL}${path}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          // GitHub rejects API requests without a User-Agent.
          'User-Agent': 'habit-tracker-api',
        },
      },
      schema,
    )
  }

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

    // The code is single-use and short-lived; the client secret proves that
    // the exchange comes from our server, not from whoever saw the code.
    async exchangeCode(code: string): Promise<string> {
      const body = await call(
        TOKEN_URL,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: redirectUri,
          }),
        },
        TokenResponseSchema,
      )
      // GitHub reports a bad code with 200 OK and an `error` field.
      if ('error' in body) {
        throw new GitHubError(`GitHub refused the code: ${body.error}`)
      }
      return body.access_token
    },

    // The GitHub token is used right here and then forgotten: we only need
    // to know who the user is, not to act on GitHub on their behalf.
    async fetchProfile(token: string): Promise<GitHubProfile> {
      const [user, emails] = await Promise.all([
        apiGet('/user', token, UserSchema),
        apiGet('/user/emails', token, EmailsSchema),
      ])
      return { id: String(user.id), login: user.login, emails }
    },
  }
}

export type GitHubClient = ReturnType<typeof createGitHubClient>
