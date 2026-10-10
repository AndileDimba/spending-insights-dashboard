import { useId, useRef } from 'react'
import { Link, useLocation } from 'react-router'

import { categoryColour } from '@/features/categories'
import { useProfile, useTransactions } from '@/shared/api/queries'
import type { Transaction } from '@/shared/api/schemas'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { formatCount, formatDateTime, formatMoney } from '@/shared/lib/format'
import type { Cents } from '@/shared/lib/money'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Skeleton } from '@/shared/ui/Skeleton'
import { VisuallyHidden } from '@/shared/ui/VisuallyHidden'

import { TransactionFilters } from './TransactionFilters'
import { TransactionPagination } from './TransactionPagination'
import styles from './TransactionsView.module.css'
import { useTransactionFilters } from './useTransactionFilters'

/** Matches the breakpoint where the layout has room for five columns. */
const WIDE = '(min-width: 48rem)'

/** The same URL without its page, for a link back to the first page. */
function withoutPage(search: string): string {
  const params = new URLSearchParams(search)
  params.delete('page')
  return params.toString()
}

/** The transactions list, its filters, its result count and its pages. */
export function TransactionsView() {
  const filters = useTransactionFilters()
  const page = useTransactions(
    {
      category: filters.category,
      startDate: filters.startDate,
      endDate: filters.endDate,
      sortBy: filters.sortBy,
      limit: filters.pageSize,
      offset: (filters.page - 1) * filters.pageSize,
    },
    // A category from the URL waits for /filters to confirm it (A13).
    { enabled: filters.ready },
  )
  const resultsHeading = useRef<HTMLHeadingElement>(null)
  const location = useLocation()
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

  const total = page.data?.pagination.total

  // Focus moves to the results, so keyboard and screen reader users start
  // at the new page. The old page stays on screen until it arrives (NFR P7).
  function goToPage(next: number) {
    filters.goToPage(next)
    resultsHeading.current?.focus()
  }

  return (
    <section className={styles.view} aria-label="Transactions" aria-busy={pending}>
      <TransactionFilters state={filters} />

      <div className={styles.resultsHeading}>
        <h2 ref={resultsHeading} tabIndex={-1} className={styles.resultsTitle}>
          Results
        </h2>
        {/* Announced politely when the filters change the results (WCAG 4.1.3). */}
        <p role="status" aria-live="polite" className={styles.count}>
          {total === undefined
            ? ''
            : `${formatCount(total)} ${total === 1 ? 'transaction' : 'transactions'}`}
        </p>
      </div>

      {failure ? (
        <ErrorState
          title="We could not load your transactions"
          message={failure.message}
          onRetry={retry}
        />
      ) : page.isSuccess && profile.isSuccess ? (
        page.data.transactions.length === 0 ? (
          page.data.pagination.total > 0 ? (
            // The URL asked for a page past the end (A16).
            <div className={styles.empty}>
              <p>There is no page {filters.page}.</p>
              <Link to={{ search: withoutPage(location.search) }}>Go to the first page</Link>
            </div>
          ) : (
            <div className={styles.empty}>
              <p>No transactions match these filters</p>
              {filters.active && (
                <button type="button" className={styles.emptyAction} onClick={filters.clear}>
                  Clear filters
                </button>
              )}
            </div>
          )
        ) : (
          <>
            {wide ? (
              <TransactionTable
                transactions={page.data.transactions}
                currency={profile.data.currency}
              />
            ) : (
              <TransactionCards
                transactions={page.data.transactions}
                currency={profile.data.currency}
              />
            )}
            <TransactionPagination
              // The page the data on screen is from, not the one being fetched.
              page={page.data.pagination.offset / page.data.pagination.limit + 1}
              totalPages={Math.max(
                1,
                Math.ceil(page.data.pagination.total / page.data.pagination.limit),
              )}
              hasMore={page.data.pagination.hasMore}
              pageSize={filters.pageSize}
              onPage={goToPage}
              onPageSize={filters.setPageSize}
            />
          </>
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
