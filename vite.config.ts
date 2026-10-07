import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

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
})
