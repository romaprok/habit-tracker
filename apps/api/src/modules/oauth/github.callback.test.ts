import { eq } from 'drizzle-orm'
import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { GitHubClient, GitHubProfile } from './github.client.js'
import { GitHubError } from './github.client.js'
import { OAUTH_STATE_COOKIE } from './oauth-state.js'
import { oauthAccounts, users } from '../../db/schema.js'
import { createTestApp } from '../../test/test-app.js'
import { createTestDb } from '../../test/test-db.js'
import { ACCESS_COOKIE, REFRESH_COOKIE } from '../auth/cookies.js'

const WEB = 'http://localhost:5173'
const STATE = 'state-from-the-cookie-0'

function profile(overrides: Partial<GitHubProfile> = {}): GitHubProfile {
  return {
    id: '583231',
    login: 'octocat',
    emails: [{ email: 'octo@example.com', primary: true, verified: true }],
    ...overrides,
  }
}

// The fake stands in for the Adapter: same interface, no network.
function fakeGitHub(answer: () => Promise<GitHubProfile>) {
  return {
    authorizeUrl: (state: string) => `https://github.test/authorize?${state}`,
    exchangeCode: vi.fn(async () => 'gho_fake'),
    fetchProfile: vi.fn(answer),
  } satisfies GitHubClient
}

function setCookies(res: request.Response) {
  return ([] as string[]).concat(res.headers['set-cookie'] ?? [])
}

describe('GET /api/auth/github/callback', () => {
  const { pool, db, reset } = createTestDb()

  beforeEach(reset)
  afterAll(() => pool.end())

  function callback(
    github: GitHubClient,
    query = `code=abc&state=${STATE}`,
    cookie = `${OAUTH_STATE_COOKIE}=${STATE}`,
  ) {
    const app = createTestApp(pool, { github, webUrl: WEB })
    return request(app)
      .get(`/api/auth/github/callback?${query}`)
      .set('Cookie', cookie)
  }

  async function userByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email))
    return user
  }

  describe('state check', () => {
    it('rejects a state that does not match the cookie, before talking to GitHub', async () => {
      const github = fakeGitHub(async () => profile())

      const res = await callback(github, 'code=abc&state=forged')

      expect(res.headers.location).toBe(`${WEB}/login?error=github_state`)
      expect(github.exchangeCode).not.toHaveBeenCalled()
      expect(await db.$count(users)).toBe(0)
    })

    it('rejects a callback without the state cookie', async () => {
      const res = await callback(
        fakeGitHub(async () => profile()),
        undefined,
        '',
      )

      expect(res.headers.location).toBe(`${WEB}/login?error=github_state`)
    })

    it('clears the state cookie so it cannot be used twice', async () => {
      const res = await callback(fakeGitHub(async () => profile()))

      expect(
        setCookies(res).find((c) => c.startsWith(`${OAUTH_STATE_COOKIE}=;`)),
      ).toBeDefined()
    })
  })

  it('sends the user back with a message when they cancel on GitHub', async () => {
    const res = await callback(
      fakeGitHub(async () => profile()),
      `error=access_denied&state=${STATE}`,
    )

    expect(res.headers.location).toBe(`${WEB}/login?error=github_denied`)
  })

  it('creates a passwordless user, signs them in and redirects to the app', async () => {
    const res = await callback(fakeGitHub(async () => profile()))

    expect(res.status).toBe(302)
    expect(res.headers.location).toBe(`${WEB}/`)
    const user = await userByEmail('octo@example.com')
    expect(user.passwordHash).toBeNull()
    expect(
      await db.$count(oauthAccounts, eq(oauthAccounts.userId, user.id)),
    ).toBe(1)

    const cookies = setCookies(res)
    const access = cookies.find((c) => c.startsWith(`${ACCESS_COOKIE}=`))!
    expect(cookies.some((c) => c.startsWith(`${REFRESH_COOKIE}=`))).toBe(true)

    const me = await request(createTestApp(pool))
      .get('/api/auth/me')
      .set('Cookie', access.split(';')[0])
    expect(me.body.user.id).toBe(user.id)
  })

  it('links to an existing account with the same verified email; password still works', async () => {
    const app = createTestApp(pool)
    const registered = await request(app)
      .post('/api/auth/register')
      .send({ email: 'octo@example.com', password: 'correct horse' })

    await callback(fakeGitHub(async () => profile()))

    expect(await db.$count(users)).toBe(1)
    const [account] = await db.select().from(oauthAccounts)
    expect(account.userId).toBe(registered.body.user.id)
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'octo@example.com', password: 'correct horse' })
    expect(login.status).toBe(200)
  })

  it('does not link by an unverified email', async () => {
    await request(createTestApp(pool))
      .post('/api/auth/register')
      .send({ email: 'victim@example.com', password: 'correct horse' })
    const attacker = profile({
      emails: [{ email: 'victim@example.com', primary: true, verified: false }],
    })

    const res = await callback(fakeGitHub(async () => attacker))

    expect(res.headers.location).toBe(
      `${WEB}/login?error=github_no_verified_email`,
    )
    expect(await db.$count(oauthAccounts)).toBe(0)
    expect(setCookies(res).some((c) => c.startsWith(`${ACCESS_COOKIE}=`))).toBe(
      false,
    )
  })

  it('finds a returning user by GitHub id even after their email changed', async () => {
    await callback(fakeGitHub(async () => profile()))
    const first = await userByEmail('octo@example.com')

    const changed = profile({
      emails: [{ email: 'new@example.com', primary: true, verified: true }],
    })
    const res = await callback(fakeGitHub(async () => changed))

    expect(res.headers.location).toBe(`${WEB}/`)
    expect(await db.$count(users)).toBe(1)
    const [account] = await db.select().from(oauthAccounts)
    expect(account.userId).toBe(first.id)
  })

  it('refuses to link a second GitHub account to the same user', async () => {
    await callback(fakeGitHub(async () => profile()))
    const otherGitHub = profile({ id: '999', login: 'octo-alt' })

    const res = await callback(fakeGitHub(async () => otherGitHub))

    expect(res.headers.location).toBe(`${WEB}/login?error=github_conflict`)
  })

  it('redirects with a generic error when GitHub fails', async () => {
    const res = await callback(
      fakeGitHub(async () => {
        throw new GitHubError('GitHub answered 502')
      }),
    )

    expect(res.headers.location).toBe(`${WEB}/login?error=github_failed`)
    expect(await db.$count(users)).toBe(0)
  })
})
