import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { createMemoryRouter, type RouteObject, RouterProvider } from 'react-router'

interface RenderOptions {
  /** Initial URL, including any query string, e.g. '/transactions?category=Groceries'. */
  route?: string
}

/**
 * Renders a route tree inside the same providers as the app: a router (so URL
 * state and navigation work) and a fresh query client per test (so no cached
 * data leaks between tests). Retries are off so error states appear at once.
 */
export function renderRoutes(routes: RouteObject[], { route = '/' }: RenderOptions = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(routes, { initialEntries: [route] })
  const user = userEvent.setup()

  const view = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )

  return { ...view, user, router, queryClient }
}

/** Renders one piece of UI at any URL, with the app's providers. */
export function renderWithProviders(ui: ReactElement, options: RenderOptions = {}) {
  return renderRoutes([{ path: '*', element: ui }], options)
}
