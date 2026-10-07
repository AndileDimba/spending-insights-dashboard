# Roadmap

Work is planned as GitHub issues and delivered one branch and one PR at a time. This list is the backlog in delivery order; each line becomes an issue, and its number goes in the branch name.

## Milestone 0: Foundations (release 0.1.0)

| Branch | Work |
| --- | --- |
| `docs/<n>-discovery` | Discovery before code: non-functional requirements (performance budgets, browser support, WCAG 2.2 AA), threat model, low-fidelity wireframes for mobile and desktop |
| `docs/<n>-adrs-stack-decisions` | ADRs for stack, folder architecture (feature folders over Feature-Sliced Design), state management, mocking (including MSW in the Docker image), styling |
| `chore/<n>-scaffold-vite-react-ts` | Vite, React, TypeScript strict, path aliases, folder structure |
| `chore/<n>-lint-format-hooks` | ESLint, Prettier, lint-staged wired into `.githooks/pre-commit` |
| `test/<n>-vitest-rtl-setup` | Vitest, React Testing Library, user-event, vitest-axe, MSW test server, fixed clock, coverage thresholds |
| `ci/<n>-github-actions` | Lint, typecheck, test, build on every PR |
| `build/<n>-dockerfile-nginx` | Multi-stage Dockerfile, unprivileged nginx, security headers, CSP |
| `ci/<n>-security-scanning` | Dependabot, CodeQL, `npm audit` gate, Trivy image scan, `SECURITY.md`, `CODEOWNERS` |

## Milestone 1: Data layer (release 0.2.0)

| Branch | Work |
| --- | --- |
| `feature/<n>-zod-api-schemas` | Zod schemas and types for all 7 endpoints, test-first from contract tests that parse every example in the spec and reject malformed payloads |
| `feature/<n>-msw-mock-api` | MSW handlers honouring every query parameter, seeded data generator |
| `feature/<n>-api-client-query-hooks` | Fetch client, error handling, TanStack Query hooks and key factories |
| `docs/<n>-api-assumptions` | Resolve every open item in `docs/api-assumptions.md` |

## Milestone 2: Dashboard (release 0.3.0)

| Branch | Work |
| --- | --- |
| `feature/<n>-app-shell-layout` | Layout, navigation, design tokens, responsive grid, dark mode |
| `feature/<n>-profile-header` | Customer profile header |
| `feature/<n>-period-filter-url-state` | Period selector and custom date range, synced to URL |
| `feature/<n>-spending-summary-cards` | Summary KPIs with change against previous period |
| `feature/<n>-category-breakdown` | Category chart and accessible list, sorted by amount |
| `feature/<n>-monthly-trends-chart` | Trends chart with range selector |
| `feature/<n>-spending-goals` | Goal progress and status |

## Milestone 3: Transactions (release 0.4.0)

| Branch | Work |
| --- | --- |
| `feature/<n>-transactions-table` | Responsive list (cards on mobile, table on desktop) |
| `feature/<n>-transactions-filters-sort` | Category, date range, sort, all in URL |
| `feature/<n>-transactions-pagination` | Pagination with limit and offset |

## Milestone 4: Hardening (release 1.0.0)

| Branch | Work |
| --- | --- |
| `test/<n>-playwright-e2e` | Critical journeys, keyboard-only journey, accessibility scans, security header and CSP assertions, run in CI against the Docker image |
| `test/<n>-mutation-testing` | Stryker on `src/shared/lib` and `src/shared/api` with a score threshold in CI |
| `perf/<n>-code-splitting-lighthouse` | Route-level splitting, bundle check, Lighthouse report |
| `docs/<n>-readme-final` | Full README: run, test, Docker, architecture, trade-offs, next steps |
| `release/1.0.0` | Version bump, changelog, tag, submit |

## Stretch

- Spring Boot API implementing the same contract (separate folder or repository)
- CSV export of filtered transactions
- Merchant search
