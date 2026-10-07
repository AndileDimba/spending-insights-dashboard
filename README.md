# Customer Spending Insights Dashboard

A responsive financial analytics dashboard that shows a customer's spending: summary, category breakdown, monthly trends, transactions and budget goals.

> Status: in development. See [`docs/roadmap.md`](docs/roadmap.md) for progress.

## Quick start

Prerequisites: Node.js 24 (see `.nvmrc`) and npm 11. Installs fail on other Node versions on purpose (`engine-strict`).

```bash
npm ci            # install exactly what the lockfile specifies
npm run dev       # development server at http://localhost:5173
npm run build     # typecheck and production build into dist/
npm run preview   # serve the production build locally
```

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
| Production build | `npm run build` |
| Preview the production build | `npm run preview` |

Tests and Docker commands are added by the issues that introduce them (see the [roadmap](docs/roadmap.md)).

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
| [`CHANGELOG.md`](CHANGELOG.md) | Release history |

## Licence

[MIT](LICENSE)
