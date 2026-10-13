import type { RouteObject } from 'react-router'

import { AppLayout } from './layout/AppLayout'
import { PageLoading } from './layout/PageLoading'
import { NotFoundPage } from './pages/NotFoundPage'

// Each page loads with its own code: the shell (layout, navigation, router)
// renders first, with PageLoading in place of the page, and the API layer and
// Zod come with the page that needs them (#25, NFR P4). After the first visit,
// the router waits for a page's code before navigating, so focus still lands
// on the new heading. The not found page is too small to be worth a request.
export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      {
        index: true,
        hydrateFallbackElement: <PageLoading />,
        lazy: async () => ({ Component: (await import('./pages/OverviewPage')).OverviewPage }),
      },
      {
        path: 'transactions',
        hydrateFallbackElement: <PageLoading />,
        lazy: async () => ({
          Component: (await import('./pages/TransactionsPage')).TransactionsPage,
        }),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
