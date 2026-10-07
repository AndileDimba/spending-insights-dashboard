import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const strictCoverage = { statements: 95, branches: 95, functions: 95, lines: 95 }

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // Stated explicitly because it is our browser support policy (NFR B1),
    // not just a tool default: Chrome and Edge 111+, Firefox 114+, Safari 16.4+.
    target: 'baseline-widely-available',
    // Source maps are not served in production (threat model T9).
    sourcemap: false,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    // Local-time bugs then behave the same on a laptop in Johannesburg and on CI.
    env: { TZ: 'UTC' },
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx'],
      reporter: ['text', 'html', 'lcov'],
      // Targets from docs/testing-strategy.md. Money, dates, validation and
      // the API client carry the most risk, so they carry the highest bar.
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
        'src/shared/lib/**': strictCoverage,
        'src/shared/api/**': strictCoverage,
      },
    },
  },
})
