# Roadmap

Work is planned as GitHub issues and delivered one branch and one PR at a time. This list is the backlog in delivery order. Each line is an issue with refined acceptance criteria, grouped into a [milestone](https://github.com/AndileDimba/spending-insights-dashboard/milestones) that ends in a tagged release. The issue number goes in the branch name.

## Milestone 0: Foundations (release 0.1.0)

| Issue | Branch | Work |
| --- | --- | --- |
| [#1](https://github.com/AndileDimba/spending-insights-dashboard/issues/1) | `docs/1-discovery` | Discovery before code: non-functional requirements (performance budgets, browser support, WCAG 2.2 AA), threat model, low-fidelity wireframes for mobile and desktop |
| [#2](https://github.com/AndileDimba/spending-insights-dashboard/issues/2) | `docs/2-adrs-stack-decisions` | ADRs for stack, folder architecture (feature folders over Feature-Sliced Design), state management, mocking (including MSW in the Docker image), styling |
| [#3](https://github.com/AndileDimba/spending-insights-dashboard/issues/3) | `chore/3-scaffold-vite-react-ts` | Vite, React, TypeScript strict, path aliases, folder structure |
| [#4](https://github.com/AndileDimba/spending-insights-dashboard/issues/4) | `chore/4-lint-format-hooks` | ESLint, Prettier, lint-staged wired into `.githooks/pre-commit` |
| [#5](https://github.com/AndileDimba/spending-insights-dashboard/issues/5) | `test/5-vitest-rtl-setup` | Vitest, React Testing Library, user-event, axe-core assertion, MSW test server, fixed clock, coverage thresholds |
| [#6](https://github.com/AndileDimba/spending-insights-dashboard/issues/6) | `ci/6-github-actions` | Lint, typecheck, test, build on every PR |
| [#7](https://github.com/AndileDimba/spending-insights-dashboard/issues/7) | `build/7-dockerfile-nginx` | Multi-stage Dockerfile, unprivileged nginx, security headers, CSP |
| [#8](https://github.com/AndileDimba/spending-insights-dashboard/issues/8) | `ci/8-security-scanning` | Dependabot, CodeQL, `npm audit` gate, Trivy image scan, `SECURITY.md`, `CODEOWNERS` |

## Milestone 1: Data layer (release 0.2.0)

| Issue | Branch | Work |
| --- | --- | --- |
| [#9](https://github.com/AndileDimba/spending-insights-dashboard/issues/9) | `docs/9-api-assumptions` | Resolve every open item in `docs/api-assumptions.md`, before the schemas, because the decisions shape them |
| [#10](https://github.com/AndileDimba/spending-insights-dashboard/issues/10) | `feature/10-zod-api-schemas` | Zod schemas and types for all 7 endpoints, test-first from contract tests that parse every example in the spec and reject malformed payloads |
| [#11](https://github.com/AndileDimba/spending-insights-dashboard/issues/11) | `feature/11-msw-mock-api` | MSW handlers honouring every query parameter, seeded data generator |
| [#12](https://github.com/AndileDimba/spending-insights-dashboard/issues/12) | `feature/12-api-client-query-hooks` | Fetch client, error handling, TanStack Query hooks and key factories |

## Milestone 2: Dashboard (release 0.3.0)

| Issue | Branch | Work |
| --- | --- | --- |
| [#13](https://github.com/AndileDimba/spending-insights-dashboard/issues/13) | `feature/13-app-shell-layout` | Layout, navigation, design tokens, responsive grid, dark mode |
| [#14](https://github.com/AndileDimba/spending-insights-dashboard/issues/14) | `feature/14-profile-header` | Customer profile header |
| [#15](https://github.com/AndileDimba/spending-insights-dashboard/issues/15) | `feature/15-period-filter-url-state` | Period selector and custom date range, synced to URL |
| [#16](https://github.com/AndileDimba/spending-insights-dashboard/issues/16) | `feature/16-spending-summary-cards` | Summary KPIs with change against previous period |
| [#17](https://github.com/AndileDimba/spending-insights-dashboard/issues/17) | `feature/17-category-breakdown` | Category chart and accessible list, sorted by amount |
| [#18](https://github.com/AndileDimba/spending-insights-dashboard/issues/18) | `feature/18-monthly-trends-chart` | Trends chart with range selector |
| [#19](https://github.com/AndileDimba/spending-insights-dashboard/issues/19) | `feature/19-spending-goals` | Goal progress and status |

## Milestone 3: Transactions (release 0.4.0)

| Issue | Branch | Work |
| --- | --- | --- |
| [#20](https://github.com/AndileDimba/spending-insights-dashboard/issues/20) | `feature/20-transactions-table` | Responsive list (cards on mobile, table on desktop) |
| [#21](https://github.com/AndileDimba/spending-insights-dashboard/issues/21) | `feature/21-transactions-filters-sort` | Category, date range, sort, all in URL |
| [#22](https://github.com/AndileDimba/spending-insights-dashboard/issues/22) | `feature/22-transactions-pagination` | Pagination with limit and offset |

## Milestone 4: Hardening (release 1.0.0)

| Issue | Branch | Work |
| --- | --- | --- |
| [#23](https://github.com/AndileDimba/spending-insights-dashboard/issues/23) | `test/23-playwright-e2e` | Critical journeys, keyboard-only journey, accessibility scans, security header and CSP assertions, run in CI against the Docker image |
| [#24](https://github.com/AndileDimba/spending-insights-dashboard/issues/24) | `test/24-mutation-testing` | Stryker on `src/shared/lib` and `src/shared/api` with a score threshold in CI |
| [#25](https://github.com/AndileDimba/spending-insights-dashboard/issues/25) | `perf/25-code-splitting-lighthouse` | Route-level splitting, bundle check, Lighthouse report |
| [#26](https://github.com/AndileDimba/spending-insights-dashboard/issues/26) | `docs/26-readme-final` | Full README: run, test, Docker, architecture, trade-offs, next steps |
| [#27](https://github.com/AndileDimba/spending-insights-dashboard/issues/27) | `release/1.0.0` | Version bump, changelog, tag, submit |

## Stretch

Only after every must have is polished.

- [#28](https://github.com/AndileDimba/spending-insights-dashboard/issues/28) Merchant search (needs a contract extension, see the issue)
- [#29](https://github.com/AndileDimba/spending-insights-dashboard/issues/29) CSV export of filtered transactions, with formula injection protection
- [#30](https://github.com/AndileDimba/spending-insights-dashboard/issues/30) ASP.NET Core API implementing the same contract, run with the frontend through Docker Compose (see [ADR 0004](adr/0004-reference-backend-in-aspnet-core.md))
