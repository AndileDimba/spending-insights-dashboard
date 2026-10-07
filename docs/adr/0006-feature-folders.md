# 6. Feature folders with enforced boundaries, over Feature-Sliced Design

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

The folder structure decides how easily an engineer finds code, how far a change ripples, and whether features stay independent as the codebase grows. The role's team is mid-rewrite of a large app, so structure is a real concern there, not a cosmetic one. This project has two pages, six dashboard views and seven endpoints.

Options considered:

1. **Layer folders** (`components/`, `hooks/`, `services/`). Familiar, but one feature is spread across every folder and nothing stops features from depending on each other's internals.
2. **Feature-Sliced Design (FSD).** Six layers (`app`, `pages`, `widgets`, `features`, `entities`, `shared`) with strict one-way imports and a public API per slice. Scales well across many teams. For a project this size, most slices would hold a single file, and the vocabulary (slices, segments, the difference between a widget and a feature) costs every new reader time.
3. **Feature folders with enforced boundaries.** Three top-level areas, `app`, `features` and `shared`, with the two FSD ideas that matter most: one-way dependencies and a public API per feature, enforced by lint.

## Decision

Option 3.

```text
src/
  app/          providers, router, layout, error boundaries, page composition
  features/
    <feature>/  components, hooks, utilities and tests for one feature
      index.ts  the feature's public API; nothing else is imported from outside
  shared/
    api/        HTTP client, Zod schemas, fetchers, query hooks and key factories
    lib/        pure utilities: formatting, dates, URL parsing
    ui/         presentational building blocks with no feature knowledge
    hooks/      generic hooks
  mocks/        MSW handlers and the seeded data generator
```

Rules, enforced by ESLint import restrictions (#4):

- Imports flow one way: `app` to `features` to `shared`. `shared` never imports from `features` or `app`.
- A feature never imports another feature's internals, only its `index.ts`. If two features need the same thing, it moves to `shared`.
- **All API code lives in `shared/api`**, not in features, because endpoints are shared: `/filters` serves both the period selector and the transactions filters. Features consume query hooks; they never call `fetch`.
- `mocks` is imported only by the app's bootstrap and by tests.

## Consequences

- A feature can be read, tested and deleted as a unit.
- The structure can be explained in one minute, which matters for onboarding and for this review.
- If the app grew to many teams, the next step would be FSD's extra layers or packages in a monorepo. The boundaries above make that migration mechanical, because the dependency direction is already enforced.
- `shared/ui` must stay free of feature knowledge, which needs vigilance in review. The lint rule catches imports, not intent.
