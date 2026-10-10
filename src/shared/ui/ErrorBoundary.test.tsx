import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { logger } from '@/shared/lib/logger'

import { ErrorBoundary } from './ErrorBoundary'

let shouldThrow = true
function Fragile() {
  if (shouldThrow) throw new Error('Secret customer data in a message')
  return <p>Content</p>
}

function fallback(reset: () => void) {
  return (
    <button type="button" onClick={reset}>
      Retry
    </button>
  )
}

describe('ErrorBoundary', () => {
  it('shows its children when they render', () => {
    shouldThrow = false
    render(<ErrorBoundary fallback={fallback}>{<Fragile />}</ErrorBoundary>)

    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('shows the fallback instead of a crash, and tries again on reset', async () => {
    shouldThrow = true
    render(<ErrorBoundary fallback={fallback}>{<Fragile />}</ErrorBoundary>)

    shouldThrow = false
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('tries again when the reset key changes, for example after navigating', () => {
    shouldThrow = true
    const { rerender } = render(
      <ErrorBoundary fallback={fallback} resetKey="/a">
        {<Fragile />}
      </ErrorBoundary>,
    )

    shouldThrow = false
    rerender(
      <ErrorBoundary fallback={fallback} resetKey="/b">
        {<Fragile />}
      </ErrorBoundary>,
    )

    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('logs the failure without the error message, which may contain data (NFR O2)', () => {
    const log = vi.spyOn(logger, 'error')
    shouldThrow = true

    render(<ErrorBoundary fallback={fallback}>{<Fragile />}</ErrorBoundary>)

    expect(log).toHaveBeenCalledWith('ui.render_failed', { error: 'Error' })
    expect(JSON.stringify(log.mock.calls)).not.toContain('Secret')
  })
})
