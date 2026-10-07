import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'

interface RenderWithProvidersOptions {
  /** Initial URL, including any query string, e.g. '/transactions?category=Groceries'. */
  route?: string
}

/**
 * Renders UI inside the same providers as the app: a router (so URL state
 * works) and a fresh query client per test (so no cached data leaks between
 * tests). Retries are off so error states appear immediately.
 */
export function renderWithProviders(
  ui: ReactElement,
  { route = '/' }: RenderWithProvidersOptions = {},
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter([{ path: '*', element: ui }], { initialEntries: [route] })
  const user = userEvent.setup()

  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )

  return { ...result, user, router, queryClient }
}
