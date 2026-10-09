import type { Cents } from '@/shared/lib/money'

import type { CategoryName } from './catalogue'

export interface MockTransaction {
  id: string
  /** ISO instant in UTC. */
  date: string
  merchant: string
  category: CategoryName
  amount: Cents
  description: string
  paymentMethod: string
}

export interface MockDataset {
  /** First day of the oldest month with data, in South African time. */
  startDate: string
  /** Today, in South African time. */
  today: string
  /** Oldest first. */
  transactions: MockTransaction[]
}

export interface GenerateOptions {
  seed: number
  now: Date
  /** Calendar months of history, including the current one. */
  months?: number
}

export function generateDataset(_options: GenerateOptions): MockDataset {
  return { startDate: '', today: '', transactions: [] }
}
