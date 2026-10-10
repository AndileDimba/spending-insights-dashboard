import '@/app/styles/tokens.css'
import '@/app/styles/global.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from '@/app/App'

/**
 * The mock API runs in the development server, and in builds made with
 * VITE_ENABLE_MOCKS=true such as the demo Docker image (ADR 0008). In any
 * other build this condition is false at build time, so the mocks are not
 * bundled at all.
 */
async function startMocks(): Promise<void> {
  if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCKS === 'true') {
    const { startMockWorker } = await import('@/mocks/browser')
    // Wait for the worker before rendering, so the first requests are mocked too.
    await startMockWorker()
  }
}

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root element #root is missing from index.html')
}

await startMocks()

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
