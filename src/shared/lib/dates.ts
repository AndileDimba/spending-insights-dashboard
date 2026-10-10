// en-CA formats a date as YYYY-MM-DD, the format the API uses.
const southAfricanDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Johannesburg',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Today's calendar date in South Africa (NFR L2, A10), as YYYY-MM-DD. */
export function todayInSouthAfrica(now: Date = new Date()): string {
  return southAfricanDay.format(now)
}
