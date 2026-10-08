# API assumptions

The API contract in [`brief/api-spec.md`](./brief/api-spec.md) shows the shape of each response but leaves behaviour unspecified. Rather than guess silently, every gap is recorded here with the decision taken, the reasoning, and the question we would put to the backend team. Until those questions are answered, the frontend and the mocks follow these decisions, and the Zod schemas (#10) and mock API (#11) implement them.

Each decision has an ID (A1, A2, ...) so code comments and tests can refer to it.

## Summary

| ID | Gap | Decision in one line |
| --- | --- | --- |
| A1 | Category order | Client sorts by amount, descending |
| A2 | `period` and `startDate`/`endDate` together | Explicit dates win; both dates or neither |
| A3 | Currency of amounts | All amounts are in the profile's currency |
| A4 | Trends length and coverage | Show the months returned; label partial months |
| A5 | Error responses | RFC 9457 Problem Details |
| A6 | Authentication and `customerId` | One mocked signed-in customer; ID never in the app URL |
| A7 | Refunds and negative amounts | Only transactions may be negative, shown as refunds |
| A8 | Goal statuses | Known: `on_track`, `warning`, `exceeded`; anything else neutral |
| A9 | Invalid query parameters | The client never sends them; the API answers 400 |
| A10 | Period date ranges | Inclusive calendar days in South African time |
| A11 | Comparison with an empty previous period | `null` change, shown as "nothing to compare" |
| A12 | Empty periods | `topCategory` is `null`; averages are 0 |
| A13 | Categories as identifiers | Exact, case-sensitive names; unknown names still render |
| A14 | Icons | Mapped to bundled icons; unknown names get a generic icon |
| A15 | API colours | Validated, decorative only, never used for text |
| A16 | Sort ties and paging | Stable order by `id`; offsets past the end return an empty page |
| A17 | Profile `totalSpent` | Lifetime spending since `joinDate` |
| A18 | Precision of amounts | At most two decimal places |
| A19 | Example data does not agree across endpoints | Examples show shape only; mocks are consistent |

## Cross-cutting decisions

### A3. Currency of amounts

- **Gap:** `currency` appears only on the profile. No other amount says what currency it is in.
- **Decision:** every amount in every response is in the profile's `currency`. Views that show money wait for the profile, which is fetched once and cached for the session. If the profile fails to load, those views show their error state rather than guessing a currency.
- **Reasoning:** showing an amount in the wrong currency, even briefly, is worse than a skeleton. One extra cached request is a small price.
- **Question for the backend:** can a customer hold accounts in more than one currency? If so, each amount needs its own currency code.

### A5. Error responses

- **Gap:** no error format is documented.
- **Decision:** errors follow [RFC 9457 Problem Details](https://www.rfc-editor.org/rfc/rfc9457) (`application/problem+json` with `type`, `title`, `status`, `detail`). The client maps errors to a small set of user messages by status: 400 (invalid request), 404 (not found), 5xx and network failures (temporarily unavailable, with retry). Server `title` and `detail` text is logged without personal data and is never shown to the customer.
- **Reasoning:** Problem Details is the standard both ASP.NET Core and Spring produce out of the box (ADR 0004). Not showing server text avoids leaking internals (threat T9) and keeps the copy consistent.
- **Question for the backend:** which `type` URIs will you use, and is a correlation ID returned that support staff can search for?

### A6. Authentication and `customerId`

- **Gap:** no authentication is described, and nothing says where `customerId` comes from.
- **Decision:** the app runs as one mocked signed-in customer, `12345`, set in one configuration module. In production the ID would come from the authenticated session (for example a backend-for-frontend), not from the URL. The customer ID appears in API request paths but never in the app's own URL, page title or logs (NFR PR1).
- **Reasoning:** authentication belongs to the bank's platform and is out of scope for the brief. Keeping the ID in one place makes swapping in a real session a one-line change.
- **Question for the backend:** will the API derive the customer from the session token, making `customerId` in the path redundant? That would remove a whole class of insecure direct object reference bugs.

### A9. Invalid query parameters

- **Gap:** the spec gives limits (`limit` up to 100, `months` up to 24, fixed `period` and `sortBy` values) but not what happens when they are broken.
- **Decision:** the client validates and clamps every parameter before sending it, so it never sends an invalid request (threat T4). The mock API is strict anyway: it rejects invalid values with a 400 Problem Details response, so tests can prove the client never relies on the server to fix its input.
- **Reasoning:** clamping on the server would hide client bugs. Rejecting makes them visible.
- **Question for the backend:** does the real API reject or clamp?

### A10. Period date ranges

- **Gap:** the spec does not say what dates `7d`, `30d`, `90d` or `1y` cover, what time zone dates are in, or whether ranges are inclusive. The categories example for `30d` runs from 2024-08-16 to 2024-09-16, which is a calendar month, not 30 days.
- **Decision:**
  - Dates (`YYYY-MM-DD`) are calendar days in South African time (`Africa/Johannesburg`), and ranges include both the start and the end day.
  - A period of N days ends today and covers exactly N days: `7d` is today and the 6 days before it. `1y` is 365 days.
  - Where a response includes `dateRange`, the UI shows that range and uses it for follow-on requests (for example, drilling down from a category to its transactions). It only computes a range itself when no response provides one.
  - Transaction timestamps (`date`) are instants in UTC, displayed in South African time (NFR L2).
- **Reasoning:** making the server's `dateRange` authoritative means the UI and the API cannot disagree about what "last 30 days" means, whichever definition the backend chooses.
- **Question for the backend:** is `30d` thirty days or one calendar month, as the example suggests?

### A18. Precision of amounts

- **Gap:** amounts are JSON numbers with no stated precision.
- **Decision:** amounts have at most two decimal places and are converted to integer cents at the boundary (ADR 0013). Anything with more precision, or that is not finite, is rejected as invalid data. Percentages and averages may have more decimals and are rounded for display.
- **Reasoning:** a currency amount with fractions of a cent is a data error, and surfacing it beats rounding it away silently.

## Per endpoint

### A17. Profile: `totalSpent`

- **Gap:** the profile's `totalSpent` (15420.50) does not match any period in the other examples.
- **Decision:** it is lifetime spending since `joinDate`, shown in the profile header as "Total spent since joining".
- **Question for the backend:** is it lifetime, or a rolling window?

### A2. Categories: `period` and `startDate`/`endDate` together

- **Gap:** `/spending/categories` accepts both a period and a custom range. Precedence is not defined.
- **Decision:** when both `startDate` and `endDate` are sent, they win and `period` is ignored. Sending only one of them is a 400 (A9). The client never sends both kinds: it sends either `period` or the two dates.
- **Reasoning:** an explicit range is the more specific request, which is the usual convention. Never mixing them on the client means the precedence rule never matters in practice.
- **Question for the backend:** please confirm the precedence, or reject requests that mix them.

### A1. Categories: order

- **Gap:** the example is not sorted by amount (Utilities R458.70 is listed after Shopping R450.80).
- **Decision:** the UI sorts categories by amount, descending, with name as a tie-breaker. It does not rely on response order.
- **Reasoning:** order is not part of the contract. Sorting a handful of items on the client is cheap and makes the UI deterministic.

### A11 and A12. Summary: empty periods and comparisons

- **Gap:** the spec does not say what `comparedToPrevious` contains when the previous period had no spending (a percentage change from zero is undefined), or what `topCategory` and `averageTransaction` are when the period has no transactions.
- **Decision:**
  - `spentChange` and `transactionChange` may be `null` when the previous period has nothing to compare against. The UI shows "Nothing to compare with the previous period".
  - In a period with no transactions, `topCategory` is `null`, `averageTransaction` is 0, and the summary shows the empty state.
- **Reasoning:** `null` is honest. Any number (0%, 100%, infinity) would be misleading on a banking screen.
- **Question for the backend:** is this how the API represents these cases?

### A4. Trends: length and coverage

- **Gap:** trends default to 12 months but the example returns 6, and the example months (2024-01 to 2024-06) do not overlap the categories example (2024-08 to 2024-09).
- **Decision:**
  - The client asks for 6, 12 or 24 months (default 12) and shows exactly the months returned, oldest first. If fewer come back than were asked for, for example because the customer joined recently, the chart says "Showing 6 of 12 months".
  - Missing months are not filled in with zeros: the UI cannot tell "no spending" from "no data".
  - The current month is included and labelled "so far", because it is incomplete.
- **Reasoning:** inventing zero months would put numbers on screen that the bank never sent.
- **Question for the backend:** are months with no spending returned with zero totals, or omitted?

### A7. Transactions: refunds and negative amounts

- **Gap:** refunds, reversals and negative amounts are not mentioned.
- **Decision:** a transaction `amount` may be negative, meaning money returned (a refund or reversal). It is shown as a credit with a plus sign and a "Refund" label, not just a colour. Totals (summary, categories, trends, goals) are net of refunds and must not be negative; a negative total is rejected as invalid data. The mock data includes a small number of refunds so this path is exercised.
- **Reasoning:** refunds are common in real card data, and a spending screen that cannot show them would eventually show a wrong total.
- **Question for the backend:** are refunds negative amounts on the original category, or separate transactions of another type?

### A13. Transactions and filters: categories as identifiers

- **Gap:** categories have no ID. Transactions, filters and goals refer to them by name.
- **Decision:** the category `name` is the identifier, matched exactly and case-sensitively. The `/filters` list is the source of truth for the category filter, and the client only sends category values from that list. A transaction or goal with a category not in the list (for example a new "Health" category) still renders, with the generic icon and a neutral colour.
- **Reasoning:** the UI should degrade gracefully when the backend adds a category before the frontend knows about it.
- **Question for the backend:** can categories get stable IDs? Names change, for example when copy is localised.

### A16. Transactions: sort ties and paging

- **Gap:** many transactions share a date or amount, and the spec does not say how ties are ordered or what happens past the last page.
- **Decision:** ties are broken by `id` so that the order is stable and no transaction appears on two pages or on none. An `offset` past the end returns an empty page with `hasMore: false`, and the UI shows an empty state with a link to the first page.
- **Reasoning:** without a stable order, offset paging can skip or repeat rows between requests.
- **Question for the backend:** would cursor-based paging be possible? It avoids the same problem when new transactions arrive while paging.

### A8. Goals: statuses

- **Gap:** only `on_track` and `warning` appear, with no thresholds and no status for an exceeded budget.
- **Decision:**
  - The UI shows the API's `status` and `percentageUsed`; it does not recalculate them.
  - It knows three statuses: `on_track` ("On track"), `warning` ("Close to limit") and `exceeded` ("Over budget"). Each has a text label and an icon, never colour alone.
  - Any other status is shown with a neutral "Status unavailable" label alongside the percentage, and is logged, rather than breaking the goals view.
  - The mock uses these thresholds: under 80% on track, 80% to 100% warning, over 100% exceeded.
- **Reasoning:** the API owns the business rule. The frontend only needs to present it safely, including statuses it has not seen before.
- **Question for the backend:** what are the real statuses and thresholds?

### A14. Icons

- **Gap:** categories carry an `icon` name (`shopping-cart`, `film`, `car`, ...), but the spec does not say which icon set the names refer to.
- **Decision:** the names match a common open-source icon naming (Lucide and Feather use these names). The frontend maps known names to icons bundled with the app, and uses a generic icon for unknown names. Icons are never loaded by name from the network.
- **Reasoning:** loading assets named by API data would be both an injection risk and a CSP exception (threat T8).

### A15. Colours from the API

- **Gap:** categories and transactions carry hex colours, with no guarantee about format or contrast.
- **Decision:** colours must match `#RRGGBB`, otherwise a design token is used instead (threat T2). They are used only for swatches and chart segments, never for text or behind text. Every segment and swatch sits next to its category name, and chart segments are separated by a border in a token colour, so no information depends on telling the colours apart.
- **Reasoning:** measured against a white background, all six example colours fall below the 3:1 minimum that WCAG 1.4.11 sets for meaningful graphics, let alone 4.5:1 for text: `#FF6B6B` 2.78, `#BB8FCE` 2.65, `#45B7D1` 2.35, `#85C1E9` 1.94, `#4ECDC4` 1.93 and `#F7DC6F` 1.36. Against the dark theme's background they pass easily (7.57 to 15.42). Using the colours only as supplementary decoration lets the bank keep its category colours without the light theme failing WCAG AA (NFR A4).
- **Question for the backend and design:** are these colours fixed by the brand, or could the palette be revised for contrast?

## Mock data

### A19. The examples do not agree with each other

- **Gap:** the examples are not consistent across endpoints. The summary has 47 transactions for 30 days while the transactions example has 1,250 in total, and the trends, categories and profile totals do not add up.
- **Decision:** the examples show the shape of each response, not a consistent data set. The mock API (#11) generates one seeded set of transactions and derives every endpoint from it, so the numbers agree with each other. Mock dates are generated relative to today, so the demo always shows recent activity; tests fix the clock and the seed, so their data never changes.
- **Reasoning:** a reviewer clicking from a category total to its transactions should see numbers that add up.
