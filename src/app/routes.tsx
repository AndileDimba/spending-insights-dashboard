import type { RouteObject } from 'react-router'

import { AppLayout } from './layout/AppLayout'
import { NotFoundPage } from './pages/NotFoundPage'
import { OverviewPage } from './pages/OverviewPage'
import { TransactionsPage } from './pages/TransactionsPage'

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <OverviewPage /> },
      { path: 'transactions', element: <TransactionsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
