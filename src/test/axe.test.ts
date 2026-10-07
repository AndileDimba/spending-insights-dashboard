import { afterEach, describe, expect, it } from 'vitest'

import { expectNoAccessibilityViolations } from './axe'

function mountImage(alt?: string): HTMLElement {
  const root = document.createElement('div')
  const image = document.createElement('img')
  image.src = '/chart.png'
  if (alt !== undefined) image.alt = alt
  root.append(image)
  document.body.append(root)
  return root
}

afterEach(() => {
  document.body.replaceChildren()
})

describe('expectNoAccessibilityViolations', () => {
  it('passes for accessible markup', async () => {
    const root = mountImage('Spending by category')

    await expect(expectNoAccessibilityViolations(root)).resolves.toBeUndefined()
  })

  it('fails and names the broken rule when markup has a violation', async () => {
    const root = mountImage()

    await expect(expectNoAccessibilityViolations(root)).rejects.toThrow(/image-alt/)
  })
})
