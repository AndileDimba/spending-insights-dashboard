import { CategoryBreakdown } from '@/features/categories'
import { SpendingGoals } from '@/features/goals'
import { PeriodSelector } from '@/features/period'
import { ProfileHeader } from '@/features/profile'
import { SpendingSummary } from '@/features/summary'
import { MonthlyTrends } from '@/features/trends'

import { Page } from '../layout/Page'

export function OverviewPage() {
  return (
    <Page title="Overview">
      <ProfileHeader />
      <PeriodSelector />
      <SpendingSummary />
      <CategoryBreakdown />
      {/* Budgets before trends: they may need action this month (wireframes). */}
      <SpendingGoals />
      <MonthlyTrends />
    </Page>
  )
}
