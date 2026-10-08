import { describe, expect, it } from 'vitest'
import type { ZodType } from 'zod'

import { examplesFromSpec } from '@/test/api-spec'

import {
  categoriesSchema,
  filtersSchema,
  goalsSchema,
  profileSchema,
  summarySchema,
  transactionsSchema,
  trendsSchema,
} from './schemas'

const endpoints: [number, string, ZodType][] = [
  [1, 'profile', profileSchema],
  [2, 'spending summary', summarySchema],
  [3, 'spending by category', categoriesSchema],
  [4, 'monthly trends', trendsSchema],
  [5, 'transactions', transactionsSchema],
  [6, 'goals', goalsSchema],
  [7, 'filters', filtersSchema],
]

describe('API contract', () => {
  const examples = examplesFromSpec()

  it('finds an example response for every endpoint in the spec', () => {
    expect([...examples.keys()]).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it.each(endpoints)('accepts the spec example for endpoint %i (%s)', (number, _name, schema) => {
    const result = schema.safeParse(examples.get(number))

    expect(result.error?.issues ?? []).toEqual([])
  })
})
