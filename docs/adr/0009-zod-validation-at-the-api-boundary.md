# 9. Validate all external data with Zod at the boundary

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

TypeScript types disappear at runtime. A response typed as `Transaction[]` can still contain a string where a number should be, a missing field, or a status the code has never seen, and the type system will not notice. In a banking app, that ends up as `NaN`, `undefined` or a wrong amount on screen, which is worse than an error message. The URL is a second source of untrusted input.

The API is described in Markdown, not in a machine-readable format such as OpenAPI.

Options considered:

1. **TypeScript types only.** No runtime cost, no runtime protection.
2. **Generate types and validators from an OpenAPI document.** The right answer when the backend publishes one. Here it would mean writing the OpenAPI document by hand first, which moves the problem rather than solving it.
3. **Valibot.** Similar model to Zod with a smaller bundle. Less widely known, so a higher cost for the next engineer.
4. **Zod.** Widely used, readable, and infers TypeScript types from schemas, so there is one definition of each shape.

## Decision

Option 4.

- Every endpoint has a Zod schema in `shared/api`. TypeScript types are inferred from the schemas, never written separately.
- Every response is parsed in the fetcher, before it reaches the query cache. A failed parse becomes a typed validation error that the UI shows as an error state, and is logged without personal data.
- Schemas are strict about what we rely on: amounts must be finite numbers, dates must match their documented format, and category colours must be `#RRGGBB` because they are used in styles (threat T2).
- Unknown enum values, such as a new goal status, are handled as decided in `docs/api-assumptions.md`, not by crashing the view.
- URL query parameters are parsed with schemas too, and fall back to safe defaults.
- The example responses in the API spec are kept as fixtures, and contract tests prove every one of them parses (#10).

## Consequences

- Bad data fails loudly and safely, at one place, instead of quietly anywhere in the UI.
- The schemas become the executable version of the contract, and the contract tests fail first when it changes.
- Zod adds to the bundle and parsing costs a little time per response. Both are small for payloads of this size and are checked against the NFR budgets.
- If the backend later publishes OpenAPI, schemas should be generated from it, and the contract tests stay as they are.
