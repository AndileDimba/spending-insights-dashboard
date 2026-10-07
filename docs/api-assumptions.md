# API assumptions

The API contract in [`brief/api-spec.md`](./brief/api-spec.md) leaves some behaviour unspecified. Rather than guess silently, each gap is recorded here with the decision taken and why. In a real team, these would be questions raised with the backend owners; the decisions below are what the frontend does until they are answered.

| # | Gap | Decision | Reasoning |
| --- | --- | --- | --- |
| 1 | Category order in the example response is not strictly by amount (Utilities R458.70 appears after Shopping R450.80). | The UI sorts categories by amount, descending. It does not rely on response order. | Order is not part of the contract. Sorting on the client is cheap and makes the UI deterministic. |
| 2 | `/spending/categories` accepts both `period` and `startDate`/`endDate`. Precedence is not defined. | _To decide_ | |
| 3 | `currency` is only present on the profile, not on monetary values. | _To decide_ | |
| 4 | Trends default to 12 months, but the example returns 6. Trend months (2024-01 to 2024-06) do not overlap the categories date range (2024-08-16 to 2024-09-16). | _To decide_ | |
| 5 | No error response shape is documented. | _To decide_ | |
| 6 | No authentication is described, and the source of `customerId` is not specified. | _To decide_ | |
| 7 | Refunds, reversals and negative amounts are not mentioned. | _To decide_ | |
| 8 | `percentageUsed` and `status` on goals: thresholds for `on_track` and `warning` (and any other statuses) are not listed. | _To decide_ | |
