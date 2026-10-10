import { Pie, PieChart } from 'recharts'

import type { Category } from '@/shared/api/schemas'

import styles from './CategoryBreakdown.module.css'
import { categoryColour } from './categoryColour'

interface CategoryChartProps {
  categories: readonly Category[]
  /** What the chart shows, for assistive technology. */
  summary: string
}

/**
 * A donut of spending by category. Loaded lazily, so the chart library never
 * delays the first paint (ADR 0011). The chart is one image with a text
 * summary; the list beside it carries every value, so the SVG itself is
 * hidden from assistive technology.
 */
export default function CategoryChart({ categories, summary }: CategoryChartProps) {
  const data = categories.map((category) => ({
    name: category.name,
    amount: category.amount,
    fill: categoryColour(category.color),
  }))

  return (
    <div role="img" aria-label={summary} className={styles.chart}>
      <PieChart width={200} height={200} accessibilityLayer={false}>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="name"
          innerRadius={58}
          outerRadius={96}
          // From 12 o'clock, clockwise: the largest category starts at the
          // top, as the list starts with it. Recharts' default is 3 o'clock,
          // anticlockwise.
          startAngle={90}
          endAngle={-270}
          // No animation, which also respects reduced motion (NFR A7).
          isAnimationActive={false}
        />
      </PieChart>
    </div>
  )
}
