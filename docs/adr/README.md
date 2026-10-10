# Architecture decision records

Why the project looks the way it does. Each record states the context, the options considered, the decision and its consequences. The format is explained in [ADR 0001](0001-record-architecture-decisions.md).

| # | Decision | Status |
| --- | --- | --- |
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted |
| [0002](0002-git-flow-branching.md) | Git Flow branching with pull requests | Accepted |
| [0003](0003-test-driven-development.md) | Test-driven development and a layered test strategy | Accepted |
| [0004](0004-reference-backend-in-aspnet-core.md) | Reference backend in ASP.NET Core rather than Spring Boot | Accepted |
| [0005](0005-react-vite-typescript-spa.md) | React single-page app built with Vite and strict TypeScript | Accepted |
| [0006](0006-feature-folders.md) | Feature folders with enforced boundaries, over Feature-Sliced Design | Accepted |
| [0007](0007-server-state-and-url-state.md) | Server state in TanStack Query, UI state in the URL, no global store | Accepted |
| [0008](0008-msw-network-layer-mocking.md) | Mock the API at the network layer with MSW, including in the Docker image | Accepted |
| [0009](0009-zod-validation-at-the-api-boundary.md) | Validate all external data with Zod at the boundary | Accepted |
| [0010](0010-css-modules-and-design-tokens.md) | CSS Modules with design tokens as CSS custom properties | Accepted |
| [0011](0011-recharts-with-accessible-alternatives.md) | Recharts for charts, always paired with an accessible alternative | Accepted |
| [0012](0012-unprivileged-nginx-runtime.md) | Serve the build from unprivileged nginx with security headers | Accepted |
| [0013](0013-money-as-integer-cents.md) | Represent money as integer cents inside the app | Accepted |
| [0014](0014-capitec-inspired-palette.md) | Capitec-inspired colours, with accessible variants | Accepted |
| [0015](0015-demo-on-vercel.md) | Host the demo on Vercel at insights.dimba.co.za | Accepted |

## Adding a decision

Copy the structure of an existing record, take the next number, and open it in the same PR as the change it explains. Accepted records are not edited; a changed decision gets a new record that supersedes the old one.
