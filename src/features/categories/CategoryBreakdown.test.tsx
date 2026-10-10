import { screen, within } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { server } from '@/mocks/node'
import { categoriesSchema, profileSchema } from '@/shared/api/schemas'
import { specExample } from '@/test/api-spec'
import { expectNoAccessibilityViolations } from '@/test/axe'
import { renderWithProviders } from '@/test/render'

import { CategoryBreakdown } from './CategoryBreakdown'

// Scenarios of #17, against the spec's categories example (2024-08-16 to
// 2024-09-16, R 4 250,75 over six categories, Utilities listed after Shopping).

const CATEGORIES_URL = '*/api/customers/12345/spending/categories'
const categories = () => specExample(categoriesSchema, 3)

let requests: URLSearchParams[] = []

function respondWith(body: object) {
  server.use(
    http.get(CATEGORIES_URL, ({ request }) => {
      requests.push(new URL(request.url).searchParams)
      return HttpResponse.json(body)
    }),
  )
}

beforeEach(() => {
  requests = []
  server.use(
    http.get('*/api/customers/12345/profile', () =>
      HttpResponse.json(specExample(profileSchema, 1)),
    ),
  )
})

async function categoryList() {
  return within(await screen.findByRole('list', { name: 'Categories by amount' }))
}

describe('CategoryBreakdown', () => {
  it('lists categories by amount, whatever order the API used (A1)', async () => {
    respondWith(categories())

    renderWithProviders(<CategoryBreakdown />)

    const names = (await categoryList())
      .getAllByRole('listitem')
      .map((item) => within(item).getByRole('link').textContent)
    expect(names).toEqual([
      'Groceries',
      'Entertainment',
      'Transportation',
      'Dining',
      'Utilities',
      'Shopping',
    ])
  })

  it('shows each category with its amount, percentage and number of transactions', async () => {
    respondWith(categories())

    renderWithProviders(<CategoryBreakdown />)

    const groceries = (await categoryList()).getAllByRole('listitem')[0]
    expect(groceries).toHaveTextContent('Groceries')
    expect(groceries).toHaveTextContent('R 1 250,30')
    expect(groceries).toHaveTextContent('29,4%')
    expect(groceries).toHaveTextContent('15 transactions')
  })

  it('gives the chart a text summary and the same data as a list, named not coloured', async () => {
    respondWith(categories())

    renderWithProviders(<CategoryBreakdown />)

    expect(
      await screen.findByRole('img', {
        name: 'Chart of spending by category. Groceries is the largest at 29,4%. The list beside it has every category.',
      }),
    ).toBeInTheDocument()
    expect((await categoryList()).getAllByRole('listitem')).toHaveLength(6)
  })

  it('shows the date range the response covers (A10)', async () => {
    respondWith(categories())

    renderWithProviders(<CategoryBreakdown />)

    expect(await screen.findByText('16 Aug 2024 to 16 Sept 2024')).toBeInTheDocument()
  })

  it('links each category to its transactions for the same dates', async () => {
    respondWith(categories())

    renderWithProviders(<CategoryBreakdown />)

    const link = (await categoryList()).getByRole('link', { name: 'Groceries' })
    const target = new URL(link.getAttribute('href') ?? '', 'http://localhost')
    expect(target.pathname).toBe('/transactions')
    expect(Object.fromEntries(target.searchParams)).toEqual({
      category: 'Groceries',
      startDate: '2024-08-16',
      endDate: '2024-09-16',
    })
  })

  it('asks for the selected period, or the custom range when one is chosen', async () => {
    respondWith(categories())

    renderWithProviders(<CategoryBreakdown />, {
      route: '/?startDate=2024-08-01&endDate=2024-08-31',
    })

    await categoryList()
    expect(Object.fromEntries(requests[0] ?? [])).toEqual({
      startDate: '2024-08-01',
      endDate: '2024-08-31',
    })
  })

  it('shows an empty state when there was no spending', async () => {
    respondWith({ ...categories(), totalAmount: 0, categories: [] })

    renderWithProviders(<CategoryBreakdown />)

    expect(await screen.findByText('No spending in this period')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('marks the region as busy while the categories load', async () => {
    server.use(
      http.get(CATEGORIES_URL, async () => {
        await delay(50)
        return HttpResponse.json(categories())
      }),
    )

    renderWithProviders(<CategoryBreakdown />)

    expect(screen.getByRole('region', { name: 'Spending by category' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    await categoryList()
    expect(screen.getByRole('region', { name: 'Spending by category' })).toHaveAttribute(
      'aria-busy',
      'false',
    )
  })

  it('requests the categories again when Retry is selected after an error', async () => {
    let attempts = 0
    server.use(
      http.get(CATEGORIES_URL, () => {
        attempts += 1
        return attempts === 1
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json(categories())
      }),
    )
    const { user } = renderWithProviders(<CategoryBreakdown />)

    expect(await screen.findByRole('alert')).toHaveTextContent('We could not load your categories')
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await categoryList()).toBeDefined()
  })

  it('has no detectable accessibility violations', async () => {
    respondWith(categories())

    const { container } = renderWithProviders(<CategoryBreakdown />)

    await screen.findByRole('img')
    await expectNoAccessibilityViolations(container)
  })
})
