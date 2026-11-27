import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    // jsdom serves the page from this URL, so '/api/...' resolves here and
    // MSW handlers can match it.
    environmentOptions: { jsdom: { url: 'http://localhost:5173' } },
  },
})
