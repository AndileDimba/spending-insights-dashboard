import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

const strictCoverage = { statements: 95, branches: 95, functions: 95, lines: 95 }

/**
 * Lets the browser fetch the first page's code alongside the app shell,
 * instead of discovering it only after the shell has run (#25, NFR P1).
 * Vite preloads static imports only; the pages and the demo's mock API are
 * dynamic imports, so their chunks are added here as modulepreload links.
 */
function preloadFirstPage(modules: readonly string[]): Plugin {
  return {
    name: 'preload-first-page',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, { bundle }) {
        if (!bundle) return []
        const chunks = Object.values(bundle).filter((output) => output.type === 'chunk')
        const byFile = new Map(chunks.map((chunk) => [chunk.fileName, chunk]))
        const files = new Set<string>()
        const add = (fileName: string) => {
          const chunk = byFile.get(fileName)
          if (!chunk || files.has(fileName)) return
          files.add(fileName)
          chunk.imports.forEach(add)
        }
        for (const chunk of chunks) {
          if (modules.some((module) => chunk.facadeModuleId?.endsWith(module))) add(chunk.fileName)
        }
        // Vite has already linked the shell's own imports.
        return [...files]
          .filter((file) => !html.includes(file))
          .map((file) => ({
            tag: 'link',
            attrs: { rel: 'modulepreload', crossorigin: true, href: `/${file}` },
            injectTo: 'head' as const,
          }))
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), preloadFirstPage(['src/app/pages/OverviewPage.tsx', 'src/mocks/browser.ts'])],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      ...(process.env.VITE_ENABLE_MOCKS === 'true' && {
        tldts: fileURLToPath(new URL('./src/mocks/stubs/tldts.ts', import.meta.url)),
      }),
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
    // CSS is not processed in tests, so CSS imports come back empty. The
    // token contrast test reads tokens.css, so that one file is processed.
    css: { include: [/tokens\.css/] },
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    // Local-time bugs then behave the same on a laptop in Johannesburg and on CI.
    env: { TZ: 'UTC' },
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      // The bootstrap and the in-page mock API need a real browser; e2e covers them (#23).
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx', 'src/mocks/browser.ts'],
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
