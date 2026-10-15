# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Purchases and refunds are reported separately, so the figures always reconcile. A category whose refunds outweighed its purchases used to vanish, and the categories then added up to more than the summary. Spending now counts purchases everywhere, and the summary shows refunds as their own figure (A21) (#115).
- While a new period loads, the summary keeps naming the period its figures are for, instead of the new one, and every view that keeps its figures on screen while it updates says "Updating" (#116).
- An inverted date range on Transactions keeps both dates, so one can be corrected, and the list waits for the correction instead of widening to every transaction (#117).

## [1.0.0] - 2026-10-14

The first production release, completing milestone 4 (Hardening). Testers confirmed the iPhone fixes from 0.3.2 to 0.4.0 (#74, #95, #99, #108) on real devices.

### Changed

- The README covers the project end to end: the live demo with screenshots, running with Docker or npm, how to run each test layer, an architecture diagram with the decisions behind it, security, trade-offs, known limitations and next steps. It was checked by following it in a fresh clone (#26).

## [0.4.0] - 2026-10-13

Milestone 4 (Hardening), most of it: end-to-end journeys, mutation testing and the performance budgets, with fixes from testers.

### Added

- End-to-end journeys in desktop Chromium, Chromium at 360px and WebKit as an iPhone: changing the period, drilling down to transactions, filters and paging in a shareable URL, the keyboard alone, an error with a retry, the not found page, security headers, and an axe scan on every page (#23).
- A `?mock=recover` scenario: every request fails until the automatic retries are used up, so the error state appears and "Try again" works (#23).
- Mutation testing with Stryker on `src/shared`, weekly and on release branches, with a 90% threshold. The first run found untested error messages, request cleanup and abort signals, now covered by 21 new tests (#24).
- A check of the JavaScript budgets on every pull request, and a performance report with Lighthouse results for the production and demo images (#25).

### Changed

- Each page's code loads on its own, and the first page's code is preloaded. The app shell is 106.5 KB gzipped, down from 139.0 KB, and the header appears before the page has loaded (#25).
- The demo's mock API is 34.9 KB instead of 143.5 KB, without the public suffix list its unused cookie support pulled in (#25).
- Playwright 1.64.0 and Vite 8.3.4. The CSP is unchanged; a WebKit bug that reports every `<select>` as a violation is ignored in WebKit tests only, with a canary for when it is fixed (#103).

### Fixed

- With the monthly figures open on a phone, the page no longer grows wider than the screen, and the figures can be scrolled from the keyboard (#99).
- The monthly figures control says it shows the figures below the chart, then how to hide them, instead of "Show as table" (#108).

## [0.3.3] - 2026-10-12

### Fixed

- The custom range's From and To fields no longer collapse on an iPhone. They take their width from the layout, as the transaction filters do (#95, a regression from #74).
- A missing file anywhere, not only under `/assets/`, is a 404 on both Vercel and nginx instead of the app. Only paths without a file extension fall back to the app (#93).

## [0.3.2] - 2026-10-11

Fixes for bugs testers found on iPhones, and end-to-end tests in three browsers.

### Fixed

- The demo no longer stops loading data after the browser stops its service worker, which an iPhone did while paging through transactions and Chrome did to a sleeping tab. The mock API now runs inside the page (ADR 0016) (#78).
- The transaction date filters fit an iPhone screen and line up with the selects, and the period selector's custom range gets the same fix (#74).
- Form controls are 16px, so iOS Safari no longer zooms in when one is tapped. Pinch-to-zoom still works (#76).
- The page heading no longer shows a focus ring after a navigation; controls keep theirs (#75).
- Zod no longer probes for `eval`, which the Content Security Policy reported as a violation on every page load (#85).

### Added

- End-to-end tests with Playwright in desktop Chromium, Chromium at 360px and WebKit as an iPhone, run in CI against the Docker image. Any uncaught error, console error or CSP violation fails a test (#23, first part).

## [0.3.1] - 2026-10-11

Fixes found by testing the live demo on real devices.

### Fixed

- Changing the period or the monthly trends range no longer scrolls the page to the top. Focus stays on the control that was used, and the summary, categories and trends keep their current data on screen, marked busy, until the new data arrives (#77).
- Reloading a page no longer moves focus to its heading, which showed a focus ring on load. Focus moves to the heading only after going to another page (#81).
- The health check on the Vercel demo answers `ok` instead of the app, and the smoke test now checks the response body, not only the status (#69).

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

[Unreleased]: https://github.com/AndileDimba/spending-insights-dashboard/compare/v1.0.0...develop
[1.0.0]: https://github.com/AndileDimba/spending-insights-dashboard/compare/v0.4.0...v1.0.0
[0.4.0]: https://github.com/AndileDimba/spending-insights-dashboard/compare/v0.3.3...v0.4.0
[0.3.3]: https://github.com/AndileDimba/spending-insights-dashboard/compare/v0.3.2...v0.3.3
[0.3.2]: https://github.com/AndileDimba/spending-insights-dashboard/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/AndileDimba/spending-insights-dashboard/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/AndileDimba/spending-insights-dashboard/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/AndileDimba/spending-insights-dashboard/releases/tag/v0.2.0
