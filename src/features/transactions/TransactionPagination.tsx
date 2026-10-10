import styles from './TransactionPagination.module.css'
import { PAGE_SIZES, type PageSize } from './useTransactionFilters'

interface TransactionPaginationProps {
  /** The page on screen, from 1. */
  page: number
  totalPages: number
  hasMore: boolean
  pageSize: PageSize
  onPage: (page: number) => void
  onPageSize: (size: PageSize) => void
}

/** Previous and Next, where you are, and how many to show per page. */
export function TransactionPagination({
  page,
  totalPages,
  hasMore,
  pageSize,
  onPage,
  onPageSize,
}: TransactionPaginationProps) {
  return (
    <nav className={styles.pagination} aria-label="Pages">
      <button
        type="button"
        className={styles.button}
        disabled={page <= 1}
        onClick={() => {
          onPage(page - 1)
        }}
        // A label rather than hidden text: the space before a hidden " page" is
        // dropped when the name is computed, giving "Previouspage". The visible
        // word stays part of the name (WCAG 2.5.3).
        aria-label="Previous page"
      >
        <span aria-hidden="true">‹ </span>
        Previous
      </button>

      <p className={styles.position}>
        Page {page} of {totalPages}
      </p>

      <button
        type="button"
        className={styles.button}
        disabled={!hasMore}
        onClick={() => {
          onPage(page + 1)
        }}
        aria-label="Next page"
      >
        Next
        <span aria-hidden="true"> ›</span>
      </button>

      <label className={styles.size}>
        <span>Per page</span>
        <select
          value={pageSize}
          onChange={(event) => {
            onPageSize(Number(event.target.value) as PageSize)
          }}
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
    </nav>
  )
}
