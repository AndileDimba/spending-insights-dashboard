import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import type { Trend } from '@/shared/api/schemas'
import { formatMoneyCompact, formatMonth } from '@/shared/lib/format'
import type { Cents } from '@/shared/lib/money'

import styles from './MonthlyTrends.module.css'

interface TrendsChartProps {
  trends: readonly Trend[]
  currency: string
  /** What the chart shows, for assistive technology. */
  summary: string
}

/**
 * Spending per month as bars. Loaded lazily (ADR 0011). The chart is one image
 * with a text summary; the table under "Show as table" carries every value.
 */
export default function TrendsChart({ trends, currency, summary }: TrendsChartProps) {
  const data = trends.map((trend) => ({
    month: formatMonth(trend.month, 'short'),
    totalSpent: trend.totalSpent,
  }))

  return (
    <div role="img" aria-label={summary} className={styles.chart}>
      <BarChart
        data={data}
        responsive
        style={{ width: '100%', height: '100%' }}
        margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
        accessibilityLayer={false}
      >
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis
          tickFormatter={(value: number) => formatMoneyCompact(value as Cents, currency)}
          tickLine={false}
          axisLine={false}
          width={64}
        />
        <Bar dataKey="totalSpent" radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </div>
  )
}
