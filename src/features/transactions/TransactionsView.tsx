import { useId } from 'react'

import { categoryColour } from '@/features/categories'
import { useProfile, useTransactions } from '@/shared/api/queries'
import type { Transaction } from '@/shared/api/schemas'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { formatDateTime, formatMoney } from '@/shared/lib/format'
import type { Cents } from '@/shared/lib/money'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Skeleton } from '@/shared/ui/Skeleton'
import { VisuallyHidden } from '@/shared/ui/VisuallyHidden'

import styles from './TransactionsView.module.css'

/** Matches the breakpoint where the layout has room for five columns. */
const WIDE = '(min-width: 48rem)'

/** The transactions list: a table on a wide screen, a list on a phone. */
export function TransactionsView() {
  const page = useTransactions({})
  // Amounts need the profile's currency (A3).
  const profile = useProfile()
  // One layout or the other, never both, so assistive technology meets each
  // transaction once.
  const wide = useMediaQuery(WIDE)

  const pending = page.isPending || profile.isPending
  const failure = page.error ?? profile.error

  function retry() {
    if (page.isError) void page.refetch()
    if (profile.isError) void profile.refetch()
  }

  return (
    <section className={styles.view} aria-label="Transactions" aria-busy={pending}>
      {failure ? (
        <ErrorState
          title="We could not load your transactions"
          message={failure.message}
          onRetry={retry}
        />
      ) : page.isSuccess && profile.isSuccess ? (
        page.data.transactions.length === 0 ? (
          <p className={styles.empty}>No transactions match these filters</p>
        ) : wide ? (
          <TransactionTable
            transactions={page.data.transactions}
            currency={profile.data.currency}
          />
        ) : (
          <TransactionCards
            transactions={page.data.transactions}
            currency={profile.data.currency}
          />
        )
      ) : (
        <Loading />
      )}
    </section>
  )
}

function Loading() {
  return (
    <div className={styles.loading}>
      <VisuallyHidden>Loading your transactions</VisuallyHidden>
      {[1, 2, 3, 4, 5].map((row) => (
        <Skeleton key={row} height="3.5rem" />
      ))}
    </div>
  )
}

interface ListProps {
  transactions: readonly Transaction[]
  currency: string
}

/** Refunds are money returned (A7): a plus sign and the word, not a sign alone. */
function Amount({ amount, currency }: { amount: Cents; currency: string }) {
  if (amount >= 0) return <span className={styles.amount}>{formatMoney(amount, currency)}</span>
  return (
    <span className={styles.refund}>
      <span className={styles.amount}>+{formatMoney(Math.abs(amount) as Cents, currency)}</span>
      <span className={styles.refundLabel}>Refund</span>
    </span>
  )
}

function Category({ transaction }: { transaction: Transaction }) {
  return (
    <span className={styles.category}>
      <span
        className={styles.swatch}
        style={{ backgroundColor: categoryColour(transaction.categoryColor) }}
        aria-hidden="true"
      />
      {transaction.category}
    </span>
  )
}

function TransactionTable({ transactions, currency }: ListProps) {
  return (
    <div className={styles.tableScroll}>
      <table className={styles.table}>
        <caption className={styles.caption}>Transactions</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Merchant</th>
            <th scope="col">Category</th>
            <th scope="col">Payment method</th>
            <th scope="col" className={styles.numeric}>
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td className={styles.date}>{formatDateTime(transaction.date)}</td>
              <th scope="row">
                {/* Layout goes on an inner span: a grid on the cell itself stops
                    it behaving as a table cell, and its borders misalign. */}
                <span className={styles.merchant}>
                  {transaction.merchant}
                  {transaction.description && (
                    <span className={styles.description}>{transaction.description}</span>
                  )}
                </span>
              </th>
              <td>
                <Category transaction={transaction} />
              </td>
              <td>{transaction.paymentMethod}</td>
              <td className={styles.numeric}>
                <Amount amount={transaction.amount} currency={currency} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TransactionCards({ transactions, currency }: ListProps) {
  return (
    <ul className={styles.cards} aria-label="Transactions">
      {transactions.map((transaction) => (
        <TransactionCard key={transaction.id} transaction={transaction} currency={currency} />
      ))}
    </ul>
  )
}

function TransactionCard({
  transaction,
  currency,
}: {
  transaction: Transaction
  currency: string
}) {
  const merchantId = useId()
  return (
    // Named by its merchant, while its whole content is still read.
    <li className={styles.card} aria-labelledby={merchantId}>
      <div className={styles.cardTop}>
        <span id={merchantId} className={styles.merchant}>
          {transaction.merchant}
        </span>
        <Amount amount={transaction.amount} currency={currency} />
      </div>
      <span className={styles.meta}>
        <Category transaction={transaction} /> · {transaction.paymentMethod}
      </span>
      <span className={styles.date}>{formatDateTime(transaction.date)}</span>
    </li>
  )
}
