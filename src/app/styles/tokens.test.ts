import { describe, expect, it } from 'vitest'

import { contrastRatio } from '@/test/contrast'

import tokensCss from './tokens.css?raw'

// Scenario "Dark mode follows the system" of #13, and NFR A4: every pair of
// colours the UI puts together meets WCAG AA in both themes.

/** The custom properties declared in the first block that matches `opening`. */
function tokensIn(css: string, opening: RegExp): Map<string, string> {
  const start = css.search(opening)
  if (start === -1) return new Map()
  const block = css.slice(start, css.indexOf('}', start))
  return new Map(
    [...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, name = '', value = '']) => [
      name,
      value.trim(),
    ]),
  )
}

const light = tokensIn(tokensCss, /:root\s*\{/)
const dark = tokensIn(tokensCss, /@media \(prefers-color-scheme: dark\)\s*\{\s*:root\s*\{/)

// [foreground, background, minimum]: 4.5:1 for text, 3:1 for focus
// indicators, control borders and graphics (WCAG 1.4.3 and 1.4.11).
const PAIRS: [string, string, number][] = [
  ['--color-text', '--color-bg', 4.5],
  ['--color-text', '--color-surface', 4.5],
  ['--color-text-muted', '--color-bg', 4.5],
  ['--color-text-muted', '--color-surface', 4.5],
  ['--color-link', '--color-bg', 4.5],
  ['--color-link', '--color-surface', 4.5],
  ['--color-on-primary', '--color-primary', 4.5],
  ['--color-danger', '--color-surface', 4.5],
  ['--color-warning', '--color-surface', 4.5],
  ['--color-success', '--color-surface', 4.5],
  ['--color-focus', '--color-bg', 3],
  ['--color-focus', '--color-surface', 3],
  ['--color-border-strong', '--color-surface', 3],
  ['--color-accent', '--color-surface', 3],
  ['--color-brand-red', '--color-surface', 3],
]

describe.each([
  ['light', light],
  ['dark', dark],
])('the %s theme', (_theme, tokens) => {
  it.each(PAIRS)('%s on %s meets %d:1', (foreground, background, minimum) => {
    const ratio = contrastRatio(
      tokens.get(foreground) ?? '#000000',
      tokens.get(background) ?? '#000000',
    )

    expect(ratio).toBeGreaterThanOrEqual(minimum)
  })
})

describe('dark mode follows the system', () => {
  it('overrides every colour token the light theme defines', () => {
    const lightColours = [...light.keys()].filter((name) => name.startsWith('--color-'))

    expect(lightColours.length).toBeGreaterThan(0)
    expect(lightColours.filter((name) => !dark.has(name))).toEqual([])
  })
})
