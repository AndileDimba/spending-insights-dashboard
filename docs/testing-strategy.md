# Testing strategy

How this project is tested, and why. The decision to work test-first is recorded in [ADR 0003](./adr/0003-test-driven-development.md). This document is the working guide and changes as the project grows.

## Principles

1. **Test behaviour, not implementation.** Tests interact with the app the way a customer does: by role, label and visible text. If a refactor breaks a test without changing behaviour, the test was wrong.
2. **Every acceptance criterion has a test** named after it, so a reviewer can trace issue to test to PR.
3. **Fail closed on bad data.** API responses are untrusted. Tests prove that invalid data produces an error state, never a wrong number on screen.
4. **Deterministic.** Seeded mock data, a fixed clock and no real network. A flaky test is treated as a bug: fixed or quarantined with an issue the same day, never retried until it passes.
5. **Coverage is a floor, not a goal.** Mutation testing tells us whether the tests would actually catch a fault.

## The layers

We follow the "testing trophy": most confidence comes from integration-level component tests, supported by static analysis below and a small number of e2e journeys above.

| Layer | Tool | What it proves | Examples in this project |
| --- | --- | --- | --- |
| Static | TypeScript strict, ESLint (typescript-eslint, react-hooks, jsx-a11y) | Whole classes of bugs cannot be written | No `any`, exhaustive `switch` on `goal.status`, labelled controls |
| Unit | Vitest | Pure logic is correct at the edges | Currency and date formatting, period to date range, category sorting, URL query parsing, the seeded data generator |
| Contract | Vitest + Zod | Our schemas match the API contract, and the mocks match our schemas | Every example in [`api-spec.md`](./brief/api-spec.md) parses; every MSW response parses; malformed payloads are rejected |
| Component | Vitest + React Testing Library + user-event + MSW | A feature works for a user, in all four states | Category breakdown shows loading, empty, error with retry, and success; changing the period refetches and updates the URL |
| Accessibility | vitest-axe, @axe-core/playwright | No detectable WCAG violations | Axe runs in every component test of a view, and on every page in e2e |
| End-to-end | Playwright against the Docker image | Critical journeys work in a real browser behind real nginx | Open dashboard, change period, filter and paginate transactions, deep link with filters, keyboard only journey |
| Mutation | Stryker | The tests catch faults, not just execute lines | Runs on `src/shared/lib` and `src/shared/api` |

## Security tests

Banking data is sensitive and the API is treated as hostile. These are written as ordinary tests in the layers above:

- **Injection:** a merchant name or description containing `<img src=x onerror=alert(1)>` renders as text. Covered in component tests and e2e.
- **Validation:** wrong types, missing fields, negative or non-finite amounts and unknown enum values (for example a new `goal.status`) produce a handled error state or a documented fallback, never `NaN` or `undefined` on screen.
- **URL tampering:** invalid query parameters (`?period=999d`, `?limit=100000`, `?category=<script>`) fall back to safe defaults and are clamped to the limits in the contract.
- **Headers and CSP:** e2e asserts that the Docker image sends the security headers and Content Security Policy, and fails on any `securitypolicyviolation` event.
- **Data exposure:** customer email and identifiers never appear in the URL, the page title or console output.

## Test data

- **Spec fixtures:** the example responses from `api-spec.md` are stored as JSON fixtures and used by the contract tests. If the contract changes, these tests fail first.
- **Seeded generator:** MSW handlers use a seeded generator for realistic volumes (for example 1,250 transactions so that pagination is meaningful). The same seed always gives the same data.
- **Per-test overrides:** component tests use `server.use(...)` to force empty, error, slow and malformed responses for a single test.
- **Fixed clock:** tests that depend on "today" (periods, days remaining) set the system time explicitly.

## The TDD loop for a story

1. **Refinement.** The issue has acceptance criteria in Given / When / Then. If a criterion cannot be tested, it is not ready.
2. **Outer loop (red).** Write a failing component test, or a Playwright test for a critical journey, for one criterion.
3. **Inner loop.** Drive the units underneath with red, green, refactor.
4. **Outer loop (green).** The acceptance test passes. Refactor with all tests green.
5. **Repeat** for the next criterion. Commit at each green step; a failing `test(...)` commit may come first on the branch.

For a bug: write the failing test that reproduces it, then fix it. The test stays as a regression guard.

## Quality gates

| Gate | Where | Threshold |
| --- | --- | --- |
| Lint, typecheck | pre-commit (staged files), CI | Zero errors, zero warnings |
| Unit, contract, component tests | CI on every PR | All pass |
| Coverage (statements, branches, functions, lines) | CI | 80% overall, 95% for `src/shared/lib` and `src/shared/api` |
| Mutation score | CI (scheduled and on release branches) | 75% on `src/shared/lib` and `src/shared/api` |
| Accessibility | Component tests and e2e | Zero axe violations |
| E2E | CI against the built Docker image | All pass (from milestone 4) |

Thresholds are set slightly below the current level when they are introduced and raised as the code matures. They are never lowered to make a PR pass.

## What we do not test, and why

- **Recharts internals.** We test that the chart receives the right data and that its accessible table alternative is correct, not the SVG paths.
- **Snapshot tests.** They are brittle and get approved without being read. We assert specific behaviour instead.
- **Visual regression.** Valuable, but it needs a stable baseline environment. It is listed as a next step in the README.

## Conventions

- Test files sit next to the code they test: `CategoryBreakdown.tsx` and `CategoryBreakdown.test.tsx`.
- Describe blocks name the unit or feature; test names read as acceptance criteria: `it('shows categories sorted by amount, largest first')`.
- Query priority follows Testing Library guidance: `getByRole`, then `getByLabelText`, then `getByText`. `getByTestId` is a last resort, and needs a comment explaining why.
- No `waitFor` around `getBy` queries. Use `findBy` instead.
