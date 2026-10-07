# 11. Recharts for charts, always paired with an accessible alternative

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

The dashboard needs a category breakdown and a monthly trend. Charts are where dashboards most often fail accessibility: meaning carried by colour alone, data available only on hover, and SVG that screen readers announce as noise. Chart libraries are also among the largest dependencies in a frontend.

Options considered:

1. **Chart.js.** Mature and fast, but draws to `<canvas>`, so there is no DOM for assistive technology, and its imperative API sits awkwardly in React.
2. **D3 directly.** Total control, but every axis, scale and transition is hand-built and hand-tested, which is a poor use of time for two standard charts.
3. **visx.** Low-level React primitives on top of D3. Flexible, but close to building charts from scratch.
4. **Recharts.** Declarative React components rendering SVG, widely used, and enough for bar, line and donut charts.

## Decision

Option 4, with these rules:

- **Every chart has an equivalent text alternative.** The category breakdown has a sorted list beside the chart with the same data; the trends chart has a "Show as table" control. The chart itself is marked as an image with a short summary label, so screen reader users get the summary and then the table, not a stream of SVG elements.
- **Colour is never the only carrier of meaning.** Every series and segment is named in a legend or label.
- **Tooltips are an extra, never the only place a value appears**, because hover does not exist on touch screens or for keyboard users.
- **Chart code is loaded lazily**, so the shell and summary render before the chart library arrives (NFR P4).
- Our tests assert the data passed to the charts and the content of the text alternatives, not Recharts' SVG output.

## Consequences

- Accessibility does not depend on the chart library's own support, which is limited.
- Recharts is a large dependency. Lazy loading keeps it out of the first load, and #25 checks the cost against the budget.
- Recharts sets styles on SVG elements. These are applied through the DOM rather than inline `<style>` tags, so they are expected to work with the strict CSP; this is verified in #17, and any CSP change is recorded in that PR.
- If the dashboard needed far more complex visualisations, visx or D3 would be worth revisiting.
