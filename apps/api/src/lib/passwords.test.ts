import { describe, expect, it } from 'vitest'

import { hashPassword, verifyPassword } from './passwords.js'

describe('passwords', () => {
  it('stores an argon2id hash, never the password itself', async () => {
    const hash = await hashPassword('correct horse battery staple')

    expect(hash).toMatch(/^\$argon2id\$/)
    expect(hash).not.toContain('correct horse')
  })

  it('salts every hash, so the same password gives different hashes', async () => {
    const [a, b] = await Promise.all([
      hashPassword('same password'),
      hashPassword('same password'),
    ])

    expect(a).not.toBe(b)
  })

  it('verifies the right password and rejects a wrong one', async () => {
    const hash = await hashPassword('s3cret-pass')

    expect(await verifyPassword(hash, 's3cret-pass')).toBe(true)
    expect(await verifyPassword(hash, 's3cret-pasS')).toBe(false)
  })
})
