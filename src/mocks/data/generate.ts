import { type Cents, toCents } from '@/shared/lib/money'

import {
  type CategoryName,
  DEBIT_ORDERS,
  type DebitOrder,
  type Merchant,
  MERCHANTS,
  REFUNDABLE_CATEGORIES,
} from './catalogue'
import { addDays, addMonths, sastDate, sastInstant } from './dates'
import { pick, type Random, randomInt, seededRandom } from './random'

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

type Draft = Omit<MockTransaction, 'id'>

// Purchases per day: [count, weight]. Averages about two a day.
const PURCHASES_PER_DAY = [
  [0, 10],
  [1, 25],
  [2, 30],
  [3, 20],
  [4, 15],
] as const

const REFUND_RATE = 0.03

function weighted<T>(random: Random, items: readonly T[], weightOf: (item: T) => number): T {
  const total = items.reduce((sum, item) => sum + weightOf(item), 0)
  let remaining = random() * total
  for (const item of items) {
    remaining -= weightOf(item)
    if (remaining < 0) return item
  }
  return pick(random, items)
}

function randomCents(random: Random, min: number, max: number): Cents {
  return randomInt(random, Math.round(min * 100), Math.round(max * 100)) as Cents
}

function fixedCents(amount: number): Cents {
  const cents = toCents(amount)
  // A mistake in our own reference data should fail loudly, not become R0.
  if (cents === undefined) throw new Error(`Invalid catalogue amount: ${String(amount)}`)
  return cents
}

function debitOrder(random: Random, order: DebitOrder, date: string): Draft {
  const amount =
    typeof order.amount === 'number'
      ? fixedCents(order.amount)
      : randomCents(random, order.amount.min, order.amount.max)
  return {
    // Debit orders run in the early hours.
    date: sastInstant(date, 3, 0).toISOString(),
    merchant: order.name,
    category: order.category,
    amount,
    description: order.description,
    paymentMethod: 'Debit Order',
  }
}

function purchase(random: Random, merchant: Merchant, date: string): Draft {
  return {
    date: sastInstant(date, randomInt(random, 7, 21), randomInt(random, 0, 59)).toISOString(),
    merchant: merchant.name,
    category: merchant.category,
    amount: randomCents(random, merchant.minAmount, merchant.maxAmount),
    description: pick(random, merchant.descriptions),
    paymentMethod: random() < 0.6 ? 'Credit Card' : 'Debit Card',
  }
}

/** Some purchases are refunded a few days later (A7). */
function refundOf(random: Random, original: Draft): Draft {
  const refundDate = addDays(sastDate(new Date(original.date)), randomInt(random, 2, 10))
  return {
    ...original,
    date: sastInstant(refundDate, randomInt(random, 8, 17), randomInt(random, 0, 59)).toISOString(),
    amount: (original.amount * -1) as Cents,
    description: 'Refund',
  }
}

/**
 * Generates a customer's transaction history. The same seed and day always
 * give the same data, so tests are stable; dates are relative to `now`, so
 * the demo always shows recent activity (A19).
 */
export function generateDataset({ seed, now, months = 18 }: GenerateOptions): MockDataset {
  const random = seededRandom(seed)
  const today = sastDate(now)
  const startDate = `${addMonths(today.slice(0, 7), -(months - 1))}-01`
  const drafts: Draft[] = []

  for (let date = startDate; date <= today; date = addDays(date, 1)) {
    const dayOfMonth = Number(date.slice(8))
    for (const order of DEBIT_ORDERS) {
      if (order.day === dayOfMonth) drafts.push(debitOrder(random, order, date))
    }

    const [count] = weighted(random, PURCHASES_PER_DAY, ([, weight]) => weight)
    for (let index = 0; index < count; index += 1) {
      const bought = purchase(
        random,
        weighted(random, MERCHANTS, (merchant) => merchant.weight),
        date,
      )
      drafts.push(bought)
      if (REFUNDABLE_CATEGORIES.includes(bought.category) && random() < REFUND_RATE) {
        drafts.push(refundOf(random, bought))
      }
    }
  }

  const nowIso = now.toISOString()
  const transactions = drafts
    .filter((draft) => draft.date <= nowIso)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((draft, index) => ({ id: `txn_${String(100001 + index)}`, ...draft }))

  return { startDate, today, transactions }
}
