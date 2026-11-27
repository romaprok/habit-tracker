import { describe, expect, it } from 'vitest'

import { pickVerifiedEmail } from './oauth.service.js'

describe('pickVerifiedEmail', () => {
  it('prefers the primary verified email, normalized', () => {
    expect(
      pickVerifiedEmail([
        { email: 'work@example.com', primary: false, verified: true },
        { email: ' Me@Example.com ', primary: true, verified: true },
      ]),
    ).toBe('me@example.com')
  })

  it('falls back to another verified email when the primary is not verified', () => {
    expect(
      pickVerifiedEmail([
        { email: 'me@example.com', primary: true, verified: false },
        { email: 'work@example.com', primary: false, verified: true },
      ]),
    ).toBe('work@example.com')
  })

  it('returns null when no email is verified', () => {
    expect(
      pickVerifiedEmail([
        { email: 'me@example.com', primary: true, verified: false },
      ]),
    ).toBeNull()
  })
})
