import { type MouseEvent, useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'

import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'
import { ErrorState } from '@/shared/ui/ErrorState'

import styles from './AppLayout.module.css'

const NAV_ITEMS = [
  { to: '/', label: 'Overview' },
  { to: '/transactions', label: 'Transactions' },
] as const

/** Skip link, header with the main navigation, and the main region for the current page. */
export function AppLayout() {
  const main = useRef<HTMLElement>(null)
  const { pathname } = useLocation()

  // Focus is moved by hand: following #main-content with a client-side router
  // does not reliably move keyboard focus in every browser.
  function skipToMain(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    main.current?.focus()
  }

  return (
    <>
      <a href="#main-content" className={styles.skipLink} onClick={skipToMain}>
        Skip to main content
      </a>

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <span className={styles.brand}>
            <svg className={styles.brandMark} viewBox="0 0 32 32" aria-hidden="true">
              <rect x="5" y="17" width="5" height="10" rx="1" fill="currentColor" />
              <rect x="13.5" y="11" width="5" height="16" rx="1" fill="currentColor" />
              <rect x="22" y="5" width="5" height="22" rx="1" fill="currentColor" />
            </svg>
            Spending Insights
          </span>

          <nav aria-label="Main">
            <ul className={styles.navList}>
              {NAV_ITEMS.map(({ to, label }) => (
                <li key={to}>
                  {/* CSS module lookups are string | undefined under noUncheckedIndexedAccess,
                      and NavLink's className does not accept undefined. */}
                  <NavLink to={to} end className={styles.navLink ?? ''}>
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main id="main-content" ref={main} tabIndex={-1} className={styles.main}>
        {/* A crash in one page leaves the header and navigation working (NFR R5). */}
        <ErrorBoundary
          resetKey={pathname}
          fallback={(reset) => (
            <ErrorState
              title="Something went wrong"
              message="This page could not be shown. Try again, or choose another page."
              onRetry={reset}
            />
          )}
        >
          <Outlet />
        </ErrorBoundary>
      </main>
    </>
  )
}
