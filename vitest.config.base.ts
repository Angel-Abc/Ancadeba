import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,

    /**
     * Match tests inside src/__tests__
     */
    include: ['src/**/__tests__/**/*.{test,spec}.{ts,tsx}'],

    /**
     * Reasonable defaults for monorepo runs
     */
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,

    /**
     * Test timeout (5 seconds)
     */
    testTimeout: 5000,

    /**
     * Coverage is opt-in per package
     */
    coverage: {
      provider: 'v8',
      reportsDirectory: '../../coverage',
      reporter: ['text', 'html'],
    },
  },
})
