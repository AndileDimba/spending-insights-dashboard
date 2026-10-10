import { PeriodSelector } from '@/features/period'
import { ProfileHeader } from '@/features/profile'
import { SpendingSummary } from '@/features/summary'

import { Page } from '../layout/Page'

export function OverviewPage() {
  return (
    <Page title="Overview">
      <ProfileHeader />
      <PeriodSelector />
      <SpendingSummary />
    </Page>
  )
}
