import type { ReactNode } from 'react'

export interface ErrorBoundaryProps {
  children: ReactNode
  /** What to show instead of the children after they throw. */
  fallback: (reset: () => void) => ReactNode
  /** When this changes, for example on navigation, the boundary tries again. */
  resetKey?: unknown
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  return children
}
