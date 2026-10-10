import { Component, type ReactNode } from 'react'

import { logger } from '@/shared/lib/logger'

export interface ErrorBoundaryProps {
  children: ReactNode
  /** What to show instead of the children after they throw. */
  fallback: (reset: () => void) => ReactNode
  /** When this changes, for example on navigation, the boundary tries again. */
  resetKey?: unknown
}

interface ErrorBoundaryState {
  failed: boolean
  resetKey: unknown
}

/**
 * Contains a rendering error to the part of the page that threw, so the rest
 * of the app keeps working (NFR R5). React only supports error boundaries as
 * class components.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { failed: false, resetKey: this.props.resetKey }

  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    return { failed: true }
  }

  static getDerivedStateFromProps(
    props: ErrorBoundaryProps,
    state: ErrorBoundaryState,
  ): Partial<ErrorBoundaryState> | null {
    return props.resetKey === state.resetKey ? null : { failed: false, resetKey: props.resetKey }
  }

  override componentDidCatch(error: Error): void {
    // The error's name only: its message may contain customer data (NFR O2).
    logger.error('ui.render_failed', { error: error.name })
  }

  reset = (): void => {
    this.setState({ failed: false })
  }

  override render(): ReactNode {
    return this.state.failed ? this.props.fallback(this.reset) : this.props.children
  }
}
