# Customer Spending Insights Dashboard

[![CI](https://github.com/AndileDimba/spending-insights-dashboard/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/AndileDimba/spending-insights-dashboard/actions/workflows/ci.yml)

A responsive financial analytics dashboard that shows a customer's spending: summary, category breakdown, monthly trends, transactions and budget goals.

> Status: in development. See [`docs/roadmap.md`](docs/roadmap.md) for progress.

## Quick start

Prerequisites: Node.js 24.15 or later in the 24 line (see `.nvmrc`) and npm 11. Installs fail on other Node versions on purpose (`engine-strict`).

```bash
npm ci            # install exactly what the lockfile specifies
npm run dev       # development server at http://localhost:5173, with the mock API
npm run build     # typecheck and production build into dist/, without mocks
npm run preview   # serve the production build locally
```

## Mock API

There is no real backend: the API in [`docs/brief/api-spec.md`](docs/brief/api-spec.md) is mocked at the network layer with [MSW](https://mswjs.io/) ([ADR 0008](docs/adr/0008-msw-network-layer-mocking.md)). The app makes real `fetch` calls, and a service worker answers them with seeded data for one customer, relative to today. The same handlers serve the tests.

| Build | Mock API |
| --- | --- |
| `npm run dev` | Always on |
| `npm run build` | Off: the mocks are not bundled, and CI checks that they are absent |
| `VITE_ENABLE_MOCKS=true npm run build` | On |
| Docker image | On by default; `--build-arg VITE_ENABLE_MOCKS=false` for a real deployment |

To see the failure states, open any page with `?mock=error`, `?mock=empty` or `?mock=slow`.

## Run with Docker

The image builds the app and serves it from unprivileged nginx on port 8080 ([ADR 0012](docs/adr/0012-unprivileged-nginx-runtime.md)). It is a demo build with the mock API inside it.

```bash
docker build -t spending-insights .
docker run --rm -p 8080:8080 spending-insights
```

Then open http://localhost:8080. The container works unchanged under the restrictions a hardened platform applies, which is how CI runs it:

```bash
docker run --rm -p 8080:8080 --read-only --tmpfs /tmp \
  --cap-drop ALL --security-opt no-new-privileges spending-insights
```

To check a running container (headers, caching, deep links, the mock worker, health), run `sh scripts/docker-smoke-test.sh http://localhost:8080`. For an image built with `VITE_ENABLE_MOCKS=false`, run it with `EXPECT_MOCKS=false`.

## Commands

| Task | Command |
| --- | --- |
| Install | `npm ci` |
| Development server | `npm run dev` |
| Typecheck | `npm run typecheck` |
| Lint (zero warnings allowed) | `npm run lint` |
| Fix lint issues that can be fixed automatically | `npm run lint:fix` |
| Format | `npm run format` |
| Check formatting | `npm run format:check` |
| Tests | `npm test` |
| Tests in watch mode (for TDD) | `npm run test:watch` |
| Tests with coverage report (`coverage/index.html`) | `npm run test:coverage` |
| Production build | `npm run build` |
| Preview the production build | `npm run preview` |

End-to-end commands are added by the issue that introduces them (see the [roadmap](docs/roadmap.md)).

## Project documentation

| Document | Purpose |
| --- | --- |
| [`docs/brief/project-brief.md`](docs/brief/project-brief.md) | The brief and scope |
| [`docs/brief/api-spec.md`](docs/brief/api-spec.md) | API contract |
| [`docs/api-assumptions.md`](docs/api-assumptions.md) | Gaps in the contract and how they were resolved |
| [`docs/discovery/non-functional-requirements.md`](docs/discovery/non-functional-requirements.md) | Measurable targets for performance, accessibility, security, privacy and more |
| [`docs/discovery/threat-model.md`](docs/discovery/threat-model.md) | STRIDE threat model, security headers and residual risks |
| [`docs/discovery/wireframes.md`](docs/discovery/wireframes.md) | Information architecture and responsive layouts |
| [`docs/testing-strategy.md`](docs/testing-strategy.md) | Test-driven development, test layers, security tests and quality gates |
| [`docs/adr/`](docs/adr/README.md) | Architecture decision records, with an index |
| [`docs/roadmap.md`](docs/roadmap.md) | Delivery plan |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Branching, commits and pull requests |
| [`SECURITY.md`](SECURITY.md) | Reporting a vulnerability, and the protections in place |
| [`CHANGELOG.md`](CHANGELOG.md) | Release history |

## Licence

[MIT](LICENSE)

This is an independent project written for a job application. It is not affiliated with, endorsed by or connected to Capitec Bank. The colour palette is inspired by Capitec's, and no Capitec name, logo or other trademark is used ([ADR 0014](docs/adr/0014-capitec-inspired-palette.md)).
