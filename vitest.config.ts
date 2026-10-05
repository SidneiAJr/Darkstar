import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['darkstar/tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'packages/orm/src/**',
        'packages/cli/src/**',
        'packages/core/src/**',
      ],
      exclude: [
        'packages/*/dist/**',
        'packages/*/src/drivers/**', // drivers dependem de banco real
      ],
    },
  },
})