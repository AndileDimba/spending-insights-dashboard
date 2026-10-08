import type { z, ZodType } from 'zod'

// Read straight from the spec, so test data can never drift from it.
import apiSpec from '/docs/brief/api-spec.md?raw'

/** Returns the JSON example under each numbered "## N. Title" heading, by number. */
export function examplesFromSpec(markdown: string = apiSpec): Map<number, unknown> {
  const examples = new Map<number, unknown>()
  for (const section of markdown.split(/^## (?=\d+\.)/m).slice(1)) {
    const number = Number.parseInt(section, 10)
    // The last example in the spec has no closing fence, so end of file also ends a block.
    const json = /```json\s*\n([\s\S]*?)(?:```|$)/.exec(section)?.[1]
    if (json !== undefined) examples.set(number, JSON.parse(json))
  }
  return examples
}

/**
 * A fresh copy of the spec example for endpoint `number`, typed as the
 * schema's input so tests can change one field at a time.
 */
export function specExample<S extends ZodType>(_schema: S, number: number): z.input<S> {
  const example = examplesFromSpec().get(number)
  if (example === undefined)
    throw new Error(`The API spec has no example for endpoint ${String(number)}`)
  // Test data from the spec: the contract test proves it matches the schema.
  return structuredClone(example) as z.input<S>
}

/** The first element of a test array, failing loudly if there is none. */
export function first<T>(items: readonly T[]): T {
  const [item] = items
  if (item === undefined) throw new Error('Expected at least one item')
  return item
}
