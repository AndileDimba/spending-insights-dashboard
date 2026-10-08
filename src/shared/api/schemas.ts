import { z } from 'zod'

import { type Cents, roundToCents, toCents } from '@/shared/lib/money'

// Response schemas for the seven endpoints in docs/brief/api-spec.md. Every
// response is parsed with these before it reaches the query cache (ADR 0009).
// Decisions referenced as A1, A2, ... are in docs/api-assumptions.md.

// ---- Building blocks --------------------------------------------------------

const period = z.enum(['7d', '30d', '90d', '1y'])
const isoDate = z.iso.date()
const text = z.string().min(1)
const count = z.int().nonnegative()
const percentage = z.number().nonnegative()

function cents(convert: (value: number) => Cents | undefined, message: string) {
  return z.number().transform((value, context) => {
    const converted = convert(value)
    if (converted === undefined) {
      context.addIssue({ code: 'custom', message, input: value })
      return z.NEVER
    }
    return converted
  })
}

/** An exact amount, such as a transaction, in integer cents. May be negative (A7). */
const signedAmount = cents(toCents, 'Expected an amount with at most two decimals (A18)')

/** A total, which is net of refunds and can never be negative (A7). */
const amount = signedAmount.refine((value) => value >= 0, 'Totals must not be negative (A7)')

/** An average, which may carry more decimals and is rounded to the nearest cent (A18). */
const average = cents(roundToCents, 'Expected a finite average').refine(
  (value) => value >= 0,
  'Averages must not be negative (A7)',
)

/**
 * API colours are used in styles, so anything but #RRGGBB becomes null and the
 * UI falls back to a design token (A15, threat T2).
 */
const colour = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/)
  .nullable()
  .catch(null)

/** Percentage change from the previous period; null when there is nothing to compare (A11). */
const change = z.number().nullable()

export const GOAL_STATUSES = ['on_track', 'warning', 'exceeded'] as const
export type GoalStatus = (typeof GOAL_STATUSES)[number] | 'unknown'

/** A status the contract does not list is shown neutrally rather than failing the view (A8). */
const goalStatus = text.transform((value): GoalStatus =>
  (GOAL_STATUSES as readonly string[]).includes(value) ? (value as GoalStatus) : 'unknown',
)

// ---- Endpoints --------------------------------------------------------------

/** Email and customer ID are deliberately not parsed, so they never reach the cache (NFR PR1, PR4). */
export const profileSchema = z.object({
  name: text,
  joinDate: isoDate,
  accountType: text,
  totalSpent: amount,
  currency: z.string().regex(/^[A-Z]{3}$/),
})

export const summarySchema = z.object({
  period,
  totalSpent: amount,
  transactionCount: count,
  averageTransaction: average,
  topCategory: text.nullable(),
  comparedToPrevious: z.object({
    spentChange: change,
    transactionChange: change,
  }),
})

const category = z.object({
  name: text,
  amount,
  percentage: percentage.max(100),
  transactionCount: count,
  color: colour,
  icon: text,
})

export const categoriesSchema = z.object({
  dateRange: z
    .object({ startDate: isoDate, endDate: isoDate })
    .refine(
      ({ startDate, endDate }) => startDate <= endDate,
      'The date range ends before it starts',
    ),
  totalAmount: amount,
  // Response order is not part of the contract, so sort here (A1).
  categories: z
    .array(category)
    .transform((items) =>
      [...items].sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name)),
    ),
})

const trend = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  totalSpent: amount,
  transactionCount: count,
  averageTransaction: average,
})

export const trendsSchema = z.object({
  // Oldest first, whatever order the response uses (A4).
  trends: z
    .array(trend)
    .transform((items) => [...items].sort((a, b) => a.month.localeCompare(b.month))),
})

const transaction = z.object({
  id: text,
  date: z.iso.datetime(),
  merchant: text,
  category: text,
  amount: signedAmount,
  description: z.string(),
  paymentMethod: text,
  icon: text,
  categoryColor: colour,
})

export const transactionsSchema = z.object({
  transactions: z.array(transaction),
  pagination: z.object({
    total: count,
    limit: z.int().min(1).max(100),
    offset: count,
    hasMore: z.boolean(),
  }),
})

const goal = z.object({
  id: text,
  category: text,
  monthlyBudget: amount,
  currentSpent: amount,
  percentageUsed: percentage,
  daysRemaining: count,
  status: goalStatus,
})

export const goalsSchema = z.object({
  goals: z.array(goal),
})

export const filtersSchema = z.object({
  categories: z.array(z.object({ name: text, color: colour, icon: text })),
  dateRangePresets: z.array(z.object({ label: text, value: period })),
})

// ---- Types ------------------------------------------------------------------
// Inferred from the schemas, never written by hand (ADR 0009).

export type Period = z.output<typeof period>
export type Profile = z.output<typeof profileSchema>
export type SpendingSummary = z.output<typeof summarySchema>
export type CategoryBreakdown = z.output<typeof categoriesSchema>
export type Category = z.output<typeof category>
export type Trends = z.output<typeof trendsSchema>
export type Trend = z.output<typeof trend>
export type TransactionPage = z.output<typeof transactionsSchema>
export type Transaction = z.output<typeof transaction>
export type Goals = z.output<typeof goalsSchema>
export type Goal = z.output<typeof goal>
export type Filters = z.output<typeof filtersSchema>
