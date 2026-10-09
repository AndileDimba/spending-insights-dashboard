import type { SortBy } from '@/shared/api/params'
import type { GoalStatus, Period } from '@/shared/api/schemas'
import type { Cents } from '@/shared/lib/money'

import type { CategoryName } from './catalogue'
import type { MockDataset, MockTransaction } from './generate'

// Answers each endpoint's question from the one generated transaction list,
// so every number agrees with every other (A19). Amounts stay in cents here;
// the handlers convert them to rand for the JSON responses.

export interface DateRange {
  startDate: string
  endDate: string
}

export interface Summary {
  period: Period
  totalSpent: Cents
  transactionCount: number
  averageTransaction: Cents
  topCategory: CategoryName | null
  comparedToPrevious: { spentChange: number | null; transactionChange: number | null }
}

export interface CategoryTotal {
  name: CategoryName
  amount: Cents
  percentage: number
  transactionCount: number
  color: string
  icon: string
}

export interface MonthTotal {
  month: string
  totalSpent: Cents
  transactionCount: number
  averageTransaction: Cents
}

export interface Goal {
  id: string
  category: CategoryName
  monthlyBudget: Cents
  currentSpent: Cents
  percentageUsed: number
  daysRemaining: number
  status: Exclude<GoalStatus, 'unknown'>
}

export interface TransactionQuery {
  limit: number
  offset: number
  sortBy: SortBy
  category?: string
  startDate?: string
  endDate?: string
}

export interface TransactionPage {
  transactions: MockTransaction[]
  total: number
  hasMore: boolean
}

export function periodRange(_period: Period, _today: string): DateRange {
  throw new Error('Not implemented')
}

export function summarise(_dataset: MockDataset, _period: Period): Summary {
  throw new Error('Not implemented')
}

export function categoryBreakdown(
  _dataset: MockDataset,
  _range: DateRange,
): { dateRange: DateRange; totalAmount: Cents; categories: CategoryTotal[] } {
  throw new Error('Not implemented')
}

export function monthlyTrends(_dataset: MockDataset, _months: number): MonthTotal[] {
  throw new Error('Not implemented')
}

export function spendingGoals(_dataset: MockDataset): Goal[] {
  throw new Error('Not implemented')
}

export function queryTransactions(
  _dataset: MockDataset,
  _query: TransactionQuery,
): TransactionPage {
  throw new Error('Not implemented')
}
