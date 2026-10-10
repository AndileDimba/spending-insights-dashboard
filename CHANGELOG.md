# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-10-10

Milestone 2 (Dashboard) and milestone 3 (Transactions): the app now shows a customer's spending end to end, and a public demo is set up on Vercel.

### Added

#### Dashboard

- App shell: a skip link, header with the main navigation, page titles, focus moved to the heading after navigation, a not found page, and an error boundary that keeps the navigation working when a page fails.
- Capitec-inspired design tokens with a dark theme that follows the system, every colour pair checked for WCAG AA contrast by a test (ADR 0014).
- Profile header: name, account type, member since and lifetime spending, with the email never shown.
- Period selector: last 7, 30 or 90 days, last year, or a custom range, kept in the URL.
- Spending summary: total, transactions, average and top category, each change from the previous period stated in words.
- Spending by category: a donut chart and the same data as a list, sorted by amount, each category linking to its transactions.
- Budgets: progress for each goal, with its status in words and an icon as well as colour.
- Monthly trends: a bar chart over 6, 12 or 24 months with a table alternative, noting the month so far.

#### Transactions

- A table on wide screens and a list on phones, never both, with refunds shown as money returned.
- Filters for category and dates and a sort order, all in the URL, with the result count announced to screen readers.
- Paging with a choice of 20, 50 or 100 a page, and a way back from a page past the end.

#### Delivery

- Formatting for money, percentages, counts, dates and months in en-ZA, with dates in South African time.
- A demo deployment on Vercel with the same security headers and Content Security Policy as the Docker image (ADR 0015).
- API assumption A20: the summary endpoint takes no date range.

## [0.2.0] - 2026-10-10

The first release, covering milestone 0 (Foundations) and milestone 1 (Data layer). They ship together, so there is no 0.1.0. There is no dashboard yet: the app shows a heading, and its data layer is ready for milestone 2.

### Added

#### Foundations

- Discovery before code: measurable non-functional requirements, a STRIDE threat model and low-fidelity wireframes.
- Architecture decision records 0001 to 0013, covering Git Flow, test-driven development, the stack, feature folders, state management, mocking, validation, styling, charts, the nginx runtime, money as integer cents and the stretch backend in ASP.NET Core.
- Vite, React 19 and strict TypeScript, with a source layout guide.
- ESLint 10 with type-aware, React hooks, accessibility and Testing Library rules; architecture boundaries enforced by lint; Prettier; pre-commit checks.
- Vitest, Testing Library, an axe accessibility assertion, a strict MSW test server that fails on unhandled requests, a fixed clock and tests in UTC.
- GitHub Actions on every pull request: PR conventions, lint and format, typecheck, unit tests with coverage, build and a Docker image check. All are required checks on `develop` and `main`.
- A multi-stage Docker image: unprivileged nginx (about 30 MB), the threat model's Content Security Policy and security headers, a health check, and a smoke test that runs in CI against a read-only container with all capabilities dropped.
- Security scanning: npm audit and registry signature verification, CodeQL for code and workflows, a Trivy image scan, Dependabot with a cooldown, `SECURITY.md` with private vulnerability reporting, `CODEOWNERS`, and secret scanning with push protection.

#### Data layer

- Nineteen API assumptions decided and recorded (A1 to A19), each with its reasoning and a question for the backend team.
- Zod schemas for all seven endpoints, checked against every example in the API spec. Money becomes integer cents at the boundary; refunds, unknown goal statuses, invalid colours and empty periods are handled as decided.
- Request parameters built from untrusted input, so only values the contract allows are ever sent.
- An HTTP client with typed errors, plain-language messages, a 10 second timeout, retries for network errors and 5xx only, and logging without personal or financial data.
- TanStack Query hooks for every endpoint, with per-parameter query keys, cancellation of superseded requests, and the previous page kept on screen while the next one loads.
- A mock API on MSW 3: about 18 months of seeded South African transactions, every endpoint derived from one data set so the numbers agree, strict parameter validation with Problem Details, and error, empty and slow scenarios.
- The mock API runs in the development server and in the demo Docker image (`VITE_ENABLE_MOCKS`). A real build contains no mock code, and CI checks that.

[Unreleased]: https://github.com/AndileDimba/spending-insights-dashboard/compare/v0.3.0...develop
[0.3.0]: https://github.com/AndileDimba/spending-insights-dashboard/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/AndileDimba/spending-insights-dashboard/releases/tag/v0.2.0
