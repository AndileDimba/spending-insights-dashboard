import { screen } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/mocks/node'
import { profileSchema } from '@/shared/api/schemas'
import { specExample } from '@/test/api-spec'
import { expectNoAccessibilityViolations } from '@/test/axe'
import { renderWithProviders } from '@/test/render'

import { ProfileHeader } from './ProfileHeader'

// Scenarios of #14, against the profile example from the API spec.

const PROFILE_URL = '*/api/customers/12345/profile'
const profile = () => specExample(profileSchema, 1)

function respondWith(body: object) {
  server.use(http.get(PROFILE_URL, () => HttpResponse.json(body)))
}

describe('ProfileHeader', () => {
  it('shows the name, account type, join date and total spent', async () => {
    respondWith(profile())

    renderWithProviders(<ProfileHeader />)

    expect(await screen.findByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Premium')).toBeInTheDocument()
    expect(screen.getByText('Member since 15 January 2023')).toBeInTheDocument()
    // en-ZA formatting; the spaces are non-breaking, and matching collapses them.
    expect(screen.getByText('R 15 420,50')).toBeInTheDocument()
  })

  it('keeps a long name whole for assistive technology while it is truncated on screen', async () => {
    const longName = 'Nomvula Thandiwe Precious Mahlangu-Van der Merwe-Ndlovu'
    respondWith({ ...profile(), name: longName })

    renderWithProviders(<ProfileHeader />)

    const name = await screen.findByText(longName)
    // The CSS truncates the text visually; the full name stays in the DOM, and
    // the title shows it to mouse users on hover.
    expect(name).toHaveAttribute('title', longName)
  })

  it('does not display the email address (NFR PR4)', async () => {
    respondWith(profile())

    renderWithProviders(<ProfileHeader />)

    await screen.findByText('John Doe')
    expect(screen.queryByText(/john\.doe@email\.com/)).not.toBeInTheDocument()
  })

  it('renders a name containing markup as plain text (threat T1)', async () => {
    const injected = '<img src=x onerror=alert(1)>'
    respondWith({ ...profile(), name: injected })

    const { container } = renderWithProviders(<ProfileHeader />)

    expect(await screen.findByText(injected)).toBeInTheDocument()
    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- proving no element was created needs the raw DOM
    expect(container.querySelector('img')).toBeNull()
  })

  it('marks the region as busy while the profile loads', async () => {
    server.use(
      http.get(PROFILE_URL, async () => {
        await delay(50)
        return HttpResponse.json(profile())
      }),
    )

    renderWithProviders(<ProfileHeader />)

    expect(screen.getByRole('region', { name: 'Your profile' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    await screen.findByText('John Doe')
    expect(screen.getByRole('region', { name: 'Your profile' })).toHaveAttribute(
      'aria-busy',
      'false',
    )
  })

  it('requests the profile again when Retry is selected after an error', async () => {
    let requests = 0
    server.use(
      http.get(PROFILE_URL, () => {
        requests += 1
        return requests === 1
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json(profile())
      }),
    )
    const { user } = renderWithProviders(<ProfileHeader />)

    expect(await screen.findByRole('alert')).toHaveTextContent('We could not load your profile')
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('John Doe')).toBeInTheDocument()
    expect(requests).toBe(2)
  })

  it('has no detectable accessibility violations', async () => {
    respondWith(profile())

    const { container } = renderWithProviders(<ProfileHeader />)

    await screen.findByText('John Doe')
    await expectNoAccessibilityViolations(container)
  })
})
