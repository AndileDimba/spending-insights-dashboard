# 7. Server state in TanStack Query, UI state in the URL, no global store

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

Almost all of the state in this app is data owned by the server: profile, summary, categories, trends, transactions and goals. The rest is what the customer has chosen to look at: period, date range, category, sort order, page and page size. Customers expect to bookmark a view, share it, and use the back button.

Server data has needs that plain component state does not: caching, de-duplicating identical requests, cancelling stale requests, retrying, and keeping the previous page visible while the next one loads.

Options considered:

1. **Redux Toolkit with RTK Query.** Capable, and RTK Query handles server state well. The global store adds concepts and boilerplate that this app has no client state to justify.
2. **A small store (Zustand) with hand-written fetching.** Simple store, but caching, cancellation and retries would be rebuilt by hand, and server data copied into a store goes stale.
3. **SWR.** Lighter than TanStack Query, with fewer controls for cancellation, retries and pagination.
4. **TanStack Query for server state, the URL for view state, component state for everything local.**

## Decision

Option 4.

- **Server state:** TanStack Query. Each endpoint has a query hook and a query key factory in `shared/api`. Keys include every parameter, so each filter combination is cached separately. Requests receive the query's abort signal, so superseded requests are cancelled.
- **View state:** the URL query string, read and written through React Router. Parameters are parsed with Zod schemas and fall back to safe defaults, because a URL is user input (threat T4).
- **Local state:** `useState` inside the component that owns it, for example whether the custom date range panel is open.
- **No global client store.** If genuinely global client state appears later, such as user preferences, React context is the first step.

React Router provides routing and search parameter handling, and is the most widely used router for React, so other engineers already know it.

## Consequences

- Every view is a URL: bookmarkable, shareable, and the back button works without extra code.
- Server data is never duplicated into client state, so there is one source of truth and nothing to synchronise.
- The URL becomes an input that must be validated. That is a small, well-tested cost (#15, #21, #22).
- Engineers used to Redux need to learn query keys and invalidation. The key factories keep this consistent in one place.
