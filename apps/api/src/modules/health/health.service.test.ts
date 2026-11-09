import { describe, expect, it } from 'vitest'

import { createHealthService } from './health.service.js'

describe('health service', () => {
  it('reports db ok when the repository responds', async () => {
    const service = createHealthService({ ping: async () => {} })
    expect(await service.check()).toEqual({ api: 'ok', db: 'ok' })
  })

  it('reports db error instead of throwing when the repository fails', async () => {
    const service = createHealthService({
      ping: async () => {
        throw new Error('connection refused')
      },
    })
    expect(await service.check()).toEqual({ api: 'ok', db: 'error' })
  })
})
