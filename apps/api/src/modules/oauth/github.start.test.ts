import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'

import { createGitHubClient } from './github.client.js'
import { OAUTH_STATE_COOKIE } from './oauth-state.js'
import { createTestApp } from '../../test/test-app.js'
import { createTestDb } from '../../test/test-db.js'

const github = createGitHubClient({
  clientId: 'test-client-id',
  clientSecret: 'test-client-secret',
  redirectUri: 'http://localhost:5173/api/auth/github/callback',
})

describe('GET /api/auth/github', () => {
  const { pool } = createTestDb()

  afterAll(() => pool.end())

  it('redirects to GitHub with a state that matches a short httpOnly cookie', async () => {
    const res = await request(createTestApp(pool, { github })).get(
      '/api/auth/github',
    )

    expect(res.status).toBe(302)
    const location = new URL(res.headers.location)
    expect(location.origin + location.pathname).toBe(
      'https://github.com/login/oauth/authorize',
    )
    expect(location.searchParams.get('client_id')).toBe('test-client-id')
    expect(location.searchParams.get('scope')).toBe('read:user user:email')

    const cookie = String(res.headers['set-cookie'])
    const state = location.searchParams.get('state')
    expect(state).toMatch(/^[\w-]{22}$/)
    expect(cookie).toContain(`${OAUTH_STATE_COOKIE}=${state}`)
    expect(cookie).toMatch(/HttpOnly/)
    expect(cookie).toMatch(/SameSite=Lax/)
    expect(cookie).toMatch(/Path=\/api\/auth\/github/)
    expect(cookie).toMatch(/Max-Age=600/)
  })

  it('gives every login attempt a new state', async () => {
    const app = createTestApp(pool, { github })

    const first = await request(app).get('/api/auth/github')
    const second = await request(app).get('/api/auth/github')

    const stateOf = (res: request.Response) =>
      new URL(res.headers.location).searchParams.get('state')
    expect(stateOf(first)).not.toBe(stateOf(second))
  })

  it('sends the user back to the login page when GitHub is not configured', async () => {
    const res = await request(createTestApp(pool)).get('/api/auth/github')

    expect(res.status).toBe(302)
    expect(res.headers.location).toBe(
      'http://localhost:5173/login?error=github_unavailable',
    )
  })
})
