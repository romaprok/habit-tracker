import { describe, expect, it, vi } from 'vitest'

import { createGitHubClient, GitHubError } from './github.client.js'

type Route = (init: RequestInit) => Response

function fakeFetch(routes: Record<string, Route>) {
  return vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const route = routes[String(input)]
    if (!route) throw new Error(`Unexpected request to ${String(input)}`)
    return route(init ?? {})
  })
}

function clientWith(fetch: typeof globalThis.fetch) {
  return createGitHubClient({
    clientId: 'id',
    clientSecret: 'secret',
    redirectUri: 'http://localhost:5173/api/auth/github/callback',
    fetch,
  })
}

const TOKEN_URL = 'https://github.com/login/oauth/access_token'

describe('GitHub client', () => {
  it('exchanges the code for a token, sending the client secret', async () => {
    const fetch = fakeFetch({
      [TOKEN_URL]: () => Response.json({ access_token: 'gho_123' }),
    })

    expect(await clientWith(fetch).exchangeCode('the-code')).toBe('gho_123')
    const body = JSON.parse(String(fetch.mock.calls[0][1]?.body))
    expect(body).toMatchObject({
      client_id: 'id',
      client_secret: 'secret',
      code: 'the-code',
    })
  })

  it('throws when GitHub refuses the code with 200 OK and an error field', async () => {
    const fetch = fakeFetch({
      [TOKEN_URL]: () => Response.json({ error: 'bad_verification_code' }),
    })

    await expect(clientWith(fetch).exchangeCode('old')).rejects.toThrow(
      GitHubError,
    )
  })

  it('builds the profile from /user and /user/emails with the token', async () => {
    const fetch = fakeFetch({
      'https://api.github.com/user': () =>
        Response.json({ id: 583231, login: 'octocat', name: 'The Octocat' }),
      'https://api.github.com/user/emails': () =>
        Response.json([
          { email: 'octo@example.com', primary: true, verified: true },
        ]),
    })

    const profile = await clientWith(fetch).fetchProfile('gho_123')

    expect(profile).toEqual({
      id: '583231',
      login: 'octocat',
      emails: [{ email: 'octo@example.com', primary: true, verified: true }],
    })
    const headers = new Headers(fetch.mock.calls[0][1]?.headers)
    expect(headers.get('authorization')).toBe('Bearer gho_123')
    expect(headers.get('user-agent')).toBeTruthy()
  })

  it('turns HTTP errors, odd bodies and network failures into GitHubError', async () => {
    const failing = [
      fakeFetch({ [TOKEN_URL]: () => new Response(null, { status: 500 }) }),
      fakeFetch({ [TOKEN_URL]: () => new Response('<html>') }),
      fakeFetch({}),
    ]

    for (const fetch of failing) {
      await expect(clientWith(fetch).exchangeCode('c')).rejects.toThrow(
        GitHubError,
      )
    }
  })
})
