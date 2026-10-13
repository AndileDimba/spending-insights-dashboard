import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { beforeAll, beforeEach, describe, expect, it, onTestFinished } from 'vitest'

import { createHandlers } from '@/mocks/handlers'
import { server } from '@/mocks/node'
import { expectNoAccessibilityViolations } from '@/test/axe'
import { renderRoutes } from '@/test/render'

import { AppLayout } from './layout/AppLayout'
import { routes } from './routes'

// Scenarios of #13. "No horizontal scrolling at 360px" needs a real layout
// engine, so it is covered by the Playwright tests in #23.

const mockApi = () => createHandlers({ seed: 1, now: () => new Date('2024-09-16T12:00:00Z') })

// The overview's charts are loaded lazily, and importing the chart library
// for the first time takes many seconds under a full test run. Loading it
// here keeps that out of the first test's timeout, as the chart tests do.
beforeAll(async () => {
  await import('recharts')
  // Pages load on demand (#25); their first import is slow in the same way.
  await Promise.all([import('./pages/OverviewPage'), import('./pages/TransactionsPage')])
}, 60_000)

// Pages fetch their data, so every test here runs against the mock API.
beforeEach(() => {
  server.use(...mockApi())
})

describe('skip link', () => {
  it('is the first thing Tab reaches, and moves focus to the main region', async () => {
    const { user } = renderRoutes(routes)

    await user.tab()

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('main')).toHaveFocus()
  })
})

// #25: the shell renders before a page's code has loaded.
describe('first load', () => {
  it('shows the header and navigation at once, with the page loading', async () => {
    renderRoutes(routes)

    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(screen.getByText('Loading the page')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 1, name: 'Overview' })).toBeInTheDocument()
    expect(screen.queryByText('Loading the page')).not.toBeInTheDocument()
  })
})

describe.each([
  ['/', 'Overview'],
  ['/transactions', 'Transactions'],
  ['/no-such-page', 'Page not found'],
])('the page at %s', (route, heading) => {
  it('has header, navigation and main landmarks and exactly one h1', async () => {
    renderRoutes(routes, { route })

    // The shell is there at once; each page's code loads on its own (#25).
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('has no detectable accessibility violations', async () => {
    const { container } = renderRoutes(routes, { route })

    await expectNoAccessibilityViolations(container)
  })
})

describe('navigation between pages', () => {
  it('sets the document title on the first page without moving focus', async () => {
    renderRoutes(routes)

    await screen.findByRole('heading', { level: 1, name: 'Overview' })
    expect(document.title).toBe('Overview | Spending Insights')
    expect(document.body).toHaveFocus()
  })

  it('changes the title and moves focus to the page heading', async () => {
    const { user } = renderRoutes(routes)

    await user.click(screen.getByRole('link', { name: 'Transactions' }))

    // The page loads on demand (#25), so the heading can appear a moment
    // before the layout's effect moves focus to it.
    const heading = await screen.findByRole('heading', { level: 1, name: 'Transactions' })
    await waitFor(() => {
      expect(heading).toHaveFocus()
    })
    expect(document.title).toBe('Transactions | Spending Insights')
  })

  // #77: a query string change is not a new page, so focus must not jump.
  it('keeps focus on a control that only changes the query string', async () => {
    const { user } = renderRoutes(routes)

    await user.click(await screen.findByRole('radio', { name: '24 months' }))

    expect(screen.getByRole('radio', { name: '24 months' })).toHaveFocus()
  })

  // #81: the browser keeps React Router's key in history.state across a
  // reload, so the memory router used elsewhere cannot reproduce this.
  it('leaves focus alone when a page reached by navigation is reloaded', async () => {
    window.history.replaceState({ usr: null, key: 'before-reload', idx: 1 }, '', '/')
    onTestFinished(() => {
      window.history.replaceState(null, '', '/')
    })
    const router = createBrowserRouter(routes)

    render(
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )

    await screen.findByRole('heading', { level: 1, name: 'Overview' })
    expect(document.body).toHaveFocus()
  })

  it('marks the link to the current page', () => {
    renderRoutes(routes, { route: '/transactions' })

    expect(screen.getByRole('link', { name: 'Transactions' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: 'Overview' })).not.toHaveAttribute('aria-current')
  })
})

describe('unknown route', () => {
  it('shows a not found page with a link back to the dashboard', async () => {
    const { user } = renderRoutes(routes, { route: '/no-such-page' })

    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Go to the overview' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Overview' })).toBeInTheDocument()
  })
})

describe('a crash in one view is contained', () => {
  let shouldThrow = true
  function FragileView() {
    if (shouldThrow) throw new Error('Render failed')
    return <h1>Recovered</h1>
  }

  it('shows a fallback with a retry, and the rest of the app keeps working', async () => {
    shouldThrow = true
    const { user } = renderRoutes([
      { element: <AppLayout />, children: [{ index: true, element: <FragileView /> }] },
    ])

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()

    shouldThrow = false
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(screen.getByRole('heading', { name: 'Recovered' })).toBeInTheDocument()
  })
})
