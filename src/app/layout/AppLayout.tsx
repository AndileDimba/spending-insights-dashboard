import { type MouseEvent, useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'

import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'
import { ErrorState } from '@/shared/ui/ErrorState'

import styles from './AppLayout.module.css'

const NAV_ITEMS = [
  { to: '/', label: 'Overview' },
  { to: '/transactions', label: 'Transactions' },
] as const

/**
 * Whether this build answers from the mock API, as main.tsx decides (ADR 0008).
 * Read when rendering, so tests can stub the environment.
 */
function usesMockApi(): boolean {
  return import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCKS === 'true'
}

/** Skip link, header with the main navigation, and the main region for the current page. */
export function AppLayout() {
  const main = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  const shownPathname = useRef(pathname)

  // After going to another page, focus moves to its heading so screen reader
  // and keyboard users start at the new content, as after a full page load.
  // The layout outlives every page, so it alone can tell a new page from the
  // first load or a reload (#81), when focus is left alone and the skip link
  // stays the first Tab stop. A query string change is the same page (#77).
  useEffect(() => {
    if (shownPathname.current === pathname) return
    shownPathname.current = pathname
    main.current?.querySelector('h1')?.focus()
  }, [pathname])

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
          <div className={styles.identity}>
            <span className={styles.brand}>
              <svg className={styles.brandMark} viewBox="0 0 32 32" aria-hidden="true">
                <rect x="5" y="17" width="5" height="10" rx="1" fill="currentColor" />
                <rect x="13.5" y="11" width="5" height="16" rx="1" fill="currentColor" />
                <rect x="22" y="5" width="5" height="22" rx="1" fill="currentColor" />
              </svg>
              Spending Insights
            </span>
            {usesMockApi() && <span className={styles.demo}>Demo · simulated data</span>}
          </div>

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
