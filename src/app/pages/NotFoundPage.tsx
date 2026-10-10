import { Link } from 'react-router'

import { Page } from '../layout/Page'

export function NotFoundPage() {
  return (
    <Page title="Page not found">
      <p>We could not find the page you asked for.</p>
      <p>
        <Link to="/">Go to the overview</Link>
      </p>
    </Page>
  )
}
