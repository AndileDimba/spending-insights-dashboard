import { z } from 'zod'

// Response schemas for the seven endpoints in docs/brief/api-spec.md.
// Decisions referenced as A1, A2, ... are in docs/api-assumptions.md.

const period = z.enum(['7d', '30d', '90d', '1y'])
const isoDate = z.iso.date()
const text = z.string().min(1)
const count = z.int().nonnegative()

export const profileSchema = z.object({
  name: text,
  joinDate: isoDate,
  accountType: text,
  totalSpent: z.number(),
  currency: z.string().regex(/^[A-Z]{3}$/),
})

export const summarySchema = z.object({
  period,
  totalSpent: z.number(),
  transactionCount: count,
  averageTransaction: z.number(),
  topCategory: text,
  comparedToPrevious: z.object({
    spentChange: z.number(),
    transactionChange: z.number(),
  }),
})

export const categoriesSchema = z.object({
  dateRange: z.object({ startDate: isoDate, endDate: isoDate }),
  totalAmount: z.number(),
  categories: z.array(
    z.object({
      name: text,
      amount: z.number(),
      percentage: z.number(),
      transactionCount: count,
      color: z.string(),
      icon: text,
    }),
  ),
})

export const trendsSchema = z.object({
  trends: z.array(
    z.object({
      month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
      totalSpent: z.number(),
      transactionCount: count,
      averageTransaction: z.number(),
    }),
  ),
})

export const transactionsSchema = z.object({
  transactions: z.array(
    z.object({
      id: text,
      date: z.iso.datetime(),
      merchant: text,
      category: text,
      amount: z.number(),
      description: z.string(),
      paymentMethod: text,
      icon: text,
      categoryColor: z.string(),
    }),
  ),
  pagination: z.object({
    total: count,
    limit: count,
    offset: count,
    hasMore: z.boolean(),
  }),
})

export const goalsSchema = z.object({
  goals: z.array(
    z.object({
      id: text,
      category: text,
      monthlyBudget: z.number(),
      currentSpent: z.number(),
      percentageUsed: z.number(),
      daysRemaining: count,
      status: text,
    }),
  ),
})

export const filtersSchema = z.object({
  categories: z.array(z.object({ name: text, color: z.string(), icon: text })),
  dateRangePresets: z.array(z.object({ label: text, value: period })),
})
