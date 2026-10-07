import { screen } from '@testing-library/react'
import { useSearchParams } from 'react-router'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from './render'

function PeriodEcho() {
  const [params] = useSearchParams()
  return <p>Period: {params.get('period') ?? 'none'}</p>
}

function PeriodButton() {
  const [, setParams] = useSearchParams()
  return (
    <button
      type="button"
      onClick={() => {
        setParams({ period: '7d' })
      }}
    >
      Last 7 days
    </button>
  )
}

describe('renderWithProviders', () => {
  it('renders the UI at the requested route', () => {
    renderWithProviders(<PeriodEcho />, { route: '/?period=90d' })

    expect(screen.getByText('Period: 90d')).toBeInTheDocument()
  })

  it('exposes the current location so tests can assert URL state', async () => {
    const { user, router } = renderWithProviders(<PeriodButton />)

    await user.click(screen.getByRole('button', { name: 'Last 7 days' }))

    expect(router.state.location.search).toBe('?period=7d')
  })

  it('gives each test a query client that does not retry failed queries', () => {
    const first = renderWithProviders(<PeriodEcho />)
    const second = renderWithProviders(<PeriodEcho />)

    expect(first.queryClient.getDefaultOptions().queries?.retry).toBe(false)
    expect(first.queryClient).not.toBe(second.queryClient)
  })
})
