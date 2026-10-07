# 13. Represent money as integer cents inside the app

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

The API sends amounts as JSON numbers with two decimal places, for example `245.80`. JavaScript numbers are binary floating point, which cannot represent most decimal fractions exactly: `0.1 + 0.2` is `0.30000000000000004`. Displaying a single amount through `Intl.NumberFormat` hides this, but sums, differences and comparisons can drift by fractions of a cent, and a total that is one cent out is a visible defect in a banking app.

The app does arithmetic on money in a few places: mock data totals and percentages (#11), budget remaining on goals, and consistency checks between endpoints. More will follow as features grow.

Options considered:

1. **Keep amounts as numbers and round at display.** Simplest. Correct for display alone, but every calculation is a potential drift, and nothing in the type system says which numbers are money.
2. **A decimal library** (big.js, decimal.js). Exact decimal arithmetic. Adds a dependency and an object type to every amount, which is more than this app's addition and subtraction need.
3. **Integer minor units (cents).** Convert once at the boundary. Integers are exact in JavaScript up to 2^53, far beyond any customer's spending in cents.

## Decision

Option 3.

- The Zod schemas (ADR 0009) validate that each amount is finite and has at most two decimal places, then convert it to integer cents with `Math.round(amount * 100)`.
- Amounts in the app use a branded `Cents` type, so the compiler rejects passing a plain number, or a rand value, where cents are expected.
- All arithmetic on money happens in cents. Conversion back to rand happens only inside the formatting module, at the moment of display, with `Intl.NumberFormat('en-ZA')`.
- Percentages from the API are displayed as given. Percentages the app calculates are computed from cents.
- The currency comes from the profile, as decided in `docs/api-assumptions.md`.

## Consequences

- Totals and differences are exact, and tests can compare money with strict equality.
- The type system shows which values are money, which makes code review of anything financial easier.
- There is one conversion at the boundary and one at display, and both are unit tested and covered by mutation testing (#24).
- A value with more than two decimal places is rejected as invalid data. If the API ever sends such amounts (for example fuel prices or foreign exchange), this decision must be revisited, likely in favour of a decimal library.
