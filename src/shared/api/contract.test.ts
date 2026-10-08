import { describe, expect, it } from 'vitest'
import type { ZodType } from 'zod'

// Read straight from the spec, so the examples can never drift from it.
import apiSpec from '/docs/brief/api-spec.md?raw'

import {
  categoriesSchema,
  filtersSchema,
  goalsSchema,
  profileSchema,
  summarySchema,
  transactionsSchema,
  trendsSchema,
} from './schemas'

/** Returns the JSON example under each numbered "## N. Title" heading, by number. */
function examplesFromSpec(markdown: string): Map<number, unknown> {
  const examples = new Map<number, unknown>()
  for (const section of markdown.split(/^## (?=\d+\.)/m).slice(1)) {
    const number = Number.parseInt(section, 10)
    // The last example in the spec has no closing fence, so end of file also ends a block.
    const json = /```json\s*\n([\s\S]*?)(?:```|$)/.exec(section)?.[1]
    if (json !== undefined) examples.set(number, JSON.parse(json))
  }
  return examples
}

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
  const examples = examplesFromSpec(apiSpec)

  it('finds an example response for every endpoint in the spec', () => {
    expect([...examples.keys()]).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it.each(endpoints)('accepts the spec example for endpoint %i (%s)', (number, _name, schema) => {
    const result = schema.safeParse(examples.get(number))

    expect(result.error?.issues ?? []).toEqual([])
  })
})
