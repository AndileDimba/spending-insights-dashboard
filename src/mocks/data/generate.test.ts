import { describe, expect, it } from 'vitest'

import { CATEGORIES, DEBIT_ORDERS } from './catalogue'
import { generateDataset } from './generate'

const NOW = new Date('2024-09-16T12:00:00Z')
const dataset = generateDataset({ seed: 1, now: NOW })
const { transactions } = dataset

describe('generateDataset', () => {
  it('gives identical data for the same seed and day (deterministic)', () => {
    expect(generateDataset({ seed: 1, now: NOW })).toEqual(dataset)
  })

  it('gives different data for a different seed', () => {
    expect(generateDataset({ seed: 2, now: NOW }).transactions).not.toEqual(transactions)
  })

  it('covers 18 calendar months by default, from the first of the oldest month to now', () => {
    expect(dataset.startDate).toBe('2023-04-01')
    expect(dataset.today).toBe('2024-09-16')
    expect(transactions.every((transaction) => transaction.date <= NOW.toISOString())).toBe(true)
    expect(transactions.some((transaction) => transaction.date.startsWith('2023-04'))).toBe(true)
  })

  it('has a realistic volume of transactions for that history', () => {
    expect(transactions.length).toBeGreaterThan(1000)
    expect(transactions.length).toBeLessThan(1500)
  })

  it('lists transactions oldest first with unique ids', () => {
    const dates = transactions.map((transaction) => transaction.date)

    expect(dates).toEqual([...dates].sort())
    expect(new Set(transactions.map((transaction) => transaction.id)).size).toBe(
      transactions.length,
    )
  })

  it('uses every category, and only categories the filters endpoint lists (A13)', () => {
    const used = new Set(transactions.map((transaction) => transaction.category))

    expect(used).toEqual(new Set(CATEGORIES.map((category) => category.name)))
  })

  it('stores amounts as integer cents', () => {
    expect(transactions.every((transaction) => Number.isInteger(transaction.amount))).toBe(true)
  })

  it('runs each debit order once a month', () => {
    const netflix = transactions.filter((transaction) => transaction.merchant === 'Netflix')

    expect(netflix).toHaveLength(18)
    expect(netflix.every((transaction) => transaction.amount === 19900)).toBe(true)
    expect(netflix.every((transaction) => transaction.paymentMethod === 'Debit Order')).toBe(true)
    expect(DEBIT_ORDERS.every((order) => transactions.some((t) => t.merchant === order.name))).toBe(
      true,
    )
  })

  it('includes a few refunds, each a negative amount after a purchase from the same merchant (A7)', () => {
    const refunds = transactions.filter((transaction) => transaction.amount < 0)

    expect(refunds.length).toBeGreaterThan(5)
    expect(refunds.length / transactions.length).toBeLessThan(0.05)
    for (const refund of refunds) {
      expect(refund.description).toBe('Refund')
      const purchase = transactions.find(
        (transaction) =>
          transaction.merchant === refund.merchant &&
          transaction.amount + refund.amount === 0 &&
          transaction.date < refund.date,
      )
      expect(purchase).toBeDefined()
    }
  })
})
