import { existsSync } from 'node:fs'

import { defineConfig } from 'vitest/config'

const envFile = '../../.env'
if (existsSync(envFile)) process.loadEnvFile(envFile)

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    globalSetup: ['./src/test/global-setup.ts'],
    fileParallelism: false,
    env: { LOG_LEVEL: 'silent' },
  },
})
