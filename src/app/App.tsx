import { QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'

import { createQueryClient } from '@/shared/api/queries'

import { routes } from './routes'

const router = createBrowserRouter(routes)

export function App() {
  // One query client for the life of the app.
  const [queryClient] = useState(createQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
