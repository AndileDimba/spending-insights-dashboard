import { useProfile } from '@/shared/api/queries'
import type { Profile } from '@/shared/api/schemas'
import { formatCalendarDate, formatMoney } from '@/shared/lib/format'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Skeleton } from '@/shared/ui/Skeleton'
import { VisuallyHidden } from '@/shared/ui/VisuallyHidden'

import styles from './ProfileHeader.module.css'

/** 'premium' becomes 'Premium'. */
function accountLabel(accountType: string): string {
  return accountType.charAt(0).toUpperCase() + accountType.slice(1).replaceAll('_', ' ')
}

/**
 * Whose account this is. Shows only what it needs: the email address is never
 * rendered (NFR PR4), and the customer ID is not even parsed.
 */
export function ProfileHeader() {
  const { data: profile, status, error, refetch } = useProfile()

  return (
    <section className={styles.profile} aria-label="Your profile" aria-busy={status === 'pending'}>
      {status === 'pending' && <Loading />}
      {status === 'error' && (
        <ErrorState
          title="We could not load your profile"
          message={error.message}
          onRetry={() => void refetch()}
        />
      )}
      {status === 'success' && <Details profile={profile} />}
    </section>
  )
}

function Loading() {
  return (
    <>
      <VisuallyHidden>Loading your profile</VisuallyHidden>
      {/* The same shape as the details, so nothing moves when they arrive (NFR P3). */}
      <div className={styles.identity}>
        <Skeleton width="11rem" height="1.75rem" />
        <Skeleton width="5rem" height="1.5rem" />
      </div>
      <Skeleton width="13rem" />
      <Skeleton width="9rem" height="2.75rem" />
    </>
  )
}

function Details({ profile }: { profile: Profile }) {
  return (
    <>
      <div className={styles.identity}>
        {/* Truncated on screen when long; the title shows it whole on hover,
            and screen readers always read the full text. */}
        <p className={styles.name} title={profile.name}>
          {profile.name}
        </p>
        <p className={styles.badge}>{accountLabel(profile.accountType)}</p>
      </div>
      <p className={styles.since}>Member since {formatCalendarDate(profile.joinDate)}</p>
      <dl className={styles.total}>
        <dt>Total spent since joining</dt>
        <dd className={styles.amount}>{formatMoney(profile.totalSpent, profile.currency)}</dd>
      </dl>
    </>
  )
}
