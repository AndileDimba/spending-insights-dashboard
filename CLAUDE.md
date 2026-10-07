# CLAUDE.md

Guidance for Claude Code when working in this repository. Read this fully before making changes.

## What this project is

A take-home interview project for a **Software Engineer: Frontend** role at a South African bank. The role builds the frontend of a banking app used by over 26 million clients, so reviewers will judge this repo on ownership, architecture, code quality, testing, security and Git discipline.

The brief: build a responsive financial analytics dashboard that displays a customer's spending data (mocked data). It must be:

- Production-grade
- Shipped with a runnable `Dockerfile` that builds and runs the project
- Documented with a `README.md` that explains how to build, run and test

**This repository is the only evidence the reviewers will use to judge skill level.** Treat every file, commit and PR as something a senior reviewer will read. Deadline: **21 October 2026**. The repo must be public on GitHub.

Source material lives in `docs/brief/`:

- `docs/brief/project-brief.md` is the brief and requirements
- `docs/brief/api-spec.md` is the API contract (7 endpoints). It is the source of truth for data shapes. Do not invent fields; if something is missing, record an assumption (see below).

## Tech stack (decided, see `docs/adr/`)

| Concern | Choice | Decision |
| --- | --- | --- |
| Language | TypeScript, `strict: true`, no `any` | [ADR 0005](docs/adr/0005-react-vite-typescript-spa.md) |
| UI | React 19 with function components and hooks | [ADR 0005](docs/adr/0005-react-vite-typescript-spa.md) |
| Build | Vite | [ADR 0005](docs/adr/0005-react-vite-typescript-spa.md) |
| Routing | React Router | [ADR 0007](docs/adr/0007-server-state-and-url-state.md) |
| Server state | TanStack Query (no server data in global client state) | [ADR 0007](docs/adr/0007-server-state-and-url-state.md) |
| URL state | Filters, period, pagination and sorting live in the URL query string | [ADR 0007](docs/adr/0007-server-state-and-url-state.md) |
| API mocking | MSW (Mock Service Worker) at the network layer, in dev, tests and the Docker image | [ADR 0008](docs/adr/0008-msw-network-layer-mocking.md) |
| Runtime validation | Zod schemas at the API boundary; types are inferred from schemas | [ADR 0009](docs/adr/0009-zod-validation-at-the-api-boundary.md) |
| Charts | Recharts, each chart with an accessible table or text alternative | [ADR 0011](docs/adr/0011-recharts-with-accessible-alternatives.md) |
| Styling | CSS Modules with design tokens as CSS custom properties | [ADR 0010](docs/adr/0010-css-modules-and-design-tokens.md) |
| Unit / component tests | Vitest + React Testing Library + `@testing-library/user-event` | [ADR 0003](docs/adr/0003-test-driven-development.md) |
| Accessibility tests | `axe-core` via `src/test/axe.ts` / `@axe-core/playwright` | [ADR 0003](docs/adr/0003-test-driven-development.md) |
| End-to-end tests | Playwright | [ADR 0003](docs/adr/0003-test-driven-development.md) |
| Mutation tests | Stryker (on `src/shared/lib` and `src/shared/api`) | [ADR 0003](docs/adr/0003-test-driven-development.md) |
| Lint / format | ESLint (typescript-eslint, react-hooks, jsx-a11y) + Prettier | Tooling, no ADR |
| Git hooks | `.githooks/` (branch protection) plus lint-staged on commit | [ADR 0002](docs/adr/0002-git-flow-branching.md) |
| Container | Multi-stage Dockerfile: Node build stage, nginx (unprivileged) runtime | [ADR 0012](docs/adr/0012-unprivileged-nginx-runtime.md) |
| CI | GitHub Actions: lint, typecheck, unit tests, e2e, Docker build | Tooling, no ADR |
| Package manager | npm (lockfile committed, use `npm ci` in CI and Docker) | Tooling, no ADR |

Do not add a dependency without a clear reason. If a new library is a meaningful decision, add an ADR.

## Testing and TDD (mandatory)

We work test-first. Read [ADR 0003](docs/adr/0003-test-driven-development.md) and [`docs/testing-strategy.md`](docs/testing-strategy.md) before writing code.

- **Start from the acceptance criteria.** Before implementing, write a failing test for one Given / When / Then scenario from the issue, named after it. Then make it pass, then refactor. One scenario at a time.
- **Outside-in.** Begin with a component integration test (RTL + MSW) or a Playwright test for a critical journey, then drive units underneath.
- **Bugs start with a failing test** that reproduces them.
- **Test through the accessible UI:** `getByRole`, `getByLabelText`, `getByText`. No `getByTestId` without a comment saying why. No snapshot tests.
- **Every data view has tests for all four states** (loading, empty, error with retry, success), forced with per-test MSW overrides.
- **Security cases are tests too:** injection strings render as text, malformed API data produces an error state, tampered URL parameters fall back to safe defaults.
- **Deterministic:** seeded data, fixed clock, no real network.
- **Never weaken a test or lower a threshold** to make a change pass. If a test seems wrong, say so and explain why.
- Where TDD does not fit (visual layout, chart styling), say so in the PR and cover the result with component, axe and e2e tests.

## Architecture rules

- **Feature-based folders** ([ADR 0006](docs/adr/0006-feature-folders.md)). `src/features/<feature>/` holds that feature's components, hooks, utilities and tests, and exposes only its `index.ts`. Shared building blocks go in `src/shared/` (api, ui, lib, hooks). App wiring (providers, router, layout, page composition) goes in `src/app/`. Imports flow one way: app to features to shared. A feature never imports another feature's internals.
- **One API client.** All HTTP and all API code (schemas, fetchers, query hooks) live in `src/shared/api/`, because endpoints are shared between features. Components never call `fetch` directly. Each endpoint has a Zod schema, a typed fetcher and a TanStack Query hook with a query key factory.
- **Mocks mirror the contract.** MSW handlers live in `src/mocks/` and must honour every documented query parameter (period, date range, category, sort, limit, offset). Generate realistic, deterministic data (seeded) so tests are stable.
- **Money is integer cents** ([ADR 0013](docs/adr/0013-money-as-integer-cents.md)). Schemas convert API amounts to a branded `Cents` type; all arithmetic happens in cents; conversion back to rand happens only in the formatter. Format with `Intl.NumberFormat('en-ZA', { style: 'currency', currency })`. Format dates with `Intl.DateTimeFormat('en-ZA')`. Keep formatting in `src/shared/lib/format.ts`.
- **Every data view handles four states:** loading (skeleton), empty, error (with retry) and success. No blank screens, no unhandled promise rejections.
- **Components** are small, typed, and presentational where possible. Data fetching lives in hooks, not in leaf components. Prefer composition over prop drilling more than two levels.
- **Mobile first.** Design for 360px wide upwards. No horizontal page scroll at any breakpoint.
- **Accessibility is a requirement, not polish.** Semantic HTML, labelled controls, visible focus, keyboard navigable, colour contrast WCAG AA, charts never convey meaning by colour alone.
- **Security.** No secrets in the repo. No `dangerouslySetInnerHTML`. nginx sends security headers and a Content Security Policy. Treat all API data as untrusted and validate it.

## API assumptions

The spec has gaps. When you hit one, do not guess silently. Make a decision, implement it, and record it in `docs/api-assumptions.md` with: the gap, the decision, and the reasoning. Known gaps so far:

- Categories in the example are not sorted by amount (Utilities R458.70 listed after Shopping R450.80). The UI sorts; it does not trust response order.
- `period` and `startDate`/`endDate` can both be sent to `/spending/categories`. Precedence is unspecified.
- `currency` only exists on the profile, not on amounts.
- Trends default to 12 months but the example returns 6, and trend months do not overlap the category date range.
- No error response shape, no auth, no refunds or negative amounts are documented.
- `customerId` source is unspecified (assume a single mocked signed-in customer).

## Git workflow (mandatory)

We follow a Git Flow model, exactly as a professional team would. Full detail is in `CONTRIBUTING.md`.

### Branches

| Branch | Purpose | Branches from | Merges into |
| --- | --- | --- | --- |
| `main` | Production. Every commit is a tagged release. | n/a | n/a |
| `develop` | Integration branch for the next release | `main` | n/a |
| `feature/<issue>-<short-name>` | New functionality | `develop` | `develop` via PR |
| `bugfix/<issue>-<short-name>` | Fix for a bug found on `develop` | `develop` | `develop` via PR |
| `release/<x.y.z>` | Release stabilisation: version bump, changelog, last fixes | `develop` | `main` and back to `develop` |
| `hotfix/<x.y.z>-<short-name>` | Urgent fix to production | `main` | `main` and back to `develop` |
| `chore/`, `docs/`, `ci/`, `build/`, `perf/`, `refactor/`, `test/` | Non-feature work | `develop` | `develop` via PR |

### Hard rules for Claude

1. **Never commit directly to `main` or `develop`.** A git hook enforces this; never bypass it with `--no-verify`.
2. **Before any change, check the current branch** (`git branch --show-current`). If you are on `main` or `develop`, create a correctly named branch from the right base first. Pull the base branch before branching.
3. **Never force push** to `main`, `develop` or `release/*`. Never rewrite published history on shared branches.
4. **Everything reaches `develop` and `main` through a pull request** (`gh pr create`), using the PR template. Feature, bugfix and chore PRs target `develop`. Release and hotfix PRs target `main`, followed by a back-merge PR into `develop`.
5. **Keep branches small and focused.** One concern per branch. If a branch grows beyond roughly 400 changed lines, propose splitting it.
6. **Before every commit:** run `npm run lint`, `npm run typecheck` and `npm test`. Do not commit failing code, with one exception: on a feature or bugfix branch, a `test(...)` commit with a failing test may come first if the very next commit makes it pass (see `CONTRIBUTING.md`). Once e2e exists, run it before opening a PR.
7. **Do not merge PRs yourself unless Andile asks.** Open the PR, summarise it, and stop.
8. **Releases are tagged** on `main` as annotated tags `vX.Y.Z` (SemVer) and `CHANGELOG.md` is updated in the release branch.

### Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <imperative summary, max 72 chars>

<body: what and why, wrapped at 72>

Refs: #<issue>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`. Scopes are feature or area names, for example `transactions`, `api`, `mocks`, `docker`.

Make small, logical commits that each leave the build green. A reviewer reading `git log` should see how the project was built, step by step.

## Commands

These are added as the project is scaffolded. Keep this table up to date.

| Task | Command |
| --- | --- |
| Install | `npm ci` |
| Dev server (with MSW) | `npm run dev` |
| Lint | `npm run lint` |
| Format | `npm run format` |
| Check formatting | `npm run format:check` |
| Typecheck | `npm run typecheck` |
| Unit tests | `npm test` |
| Tests in watch mode | `npm run test:watch` |
| Coverage | `npm run test:coverage` |
| E2E tests | `npm run test:e2e` |
| Production build | `npm run build` |
| Preview production build | `npm run preview` |
| Docker build | `docker build -t spending-insights .` |
| Docker run | `docker run --rm -p 8080:8080 spending-insights` |

## Definition of ready and done

Both are defined in `CONTRIBUTING.md` under "Ways of working". Do not start an issue that is not ready (no testable acceptance criteria): raise it instead. A change is not done until every acceptance criterion has a passing test named after it and all CI gates pass.

## Writing style

- **Never use em dashes** in any written content: README, docs, ADRs, comments, commit messages, PR descriptions, UI copy. Use commas, colons, full stops or parentheses instead.
- Use South African English spelling (colour, organise, licence as noun).
- Write plainly. Explain why, not just what.
- Code comments explain intent or non-obvious decisions, never restate the code.

## Working with Andile

Andile is the engineer submitting this and will be interviewed on every decision. Prefer explaining trade-offs over silently choosing. When a decision is significant, propose it, then record it as an ADR. Do not generate code he would not be able to defend.
