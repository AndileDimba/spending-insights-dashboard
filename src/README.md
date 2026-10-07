# Source layout

The structure and its rules are decided in [ADR 0006](../docs/adr/0006-feature-folders.md). In short:

| Folder | Holds | May import from |
| --- | --- | --- |
| `app/` | Providers, router, layout, error boundaries, page composition | `features`, `shared` |
| `features/<feature>/` | One feature's components, hooks, utilities and tests. Exposes only `index.ts` | `shared`, other features' `index.ts` only |
| `shared/api/` | HTTP client, Zod schemas, fetchers, query hooks and key factories | `shared/lib` |
| `shared/lib/` | Pure utilities: formatting, dates, URL parsing | nothing in `src` |
| `shared/ui/` | Presentational building blocks with no feature knowledge | `shared/lib` |
| `shared/hooks/` | Generic hooks | `shared/lib` |
| `mocks/` | MSW handlers and the seeded data generator. Used by the app bootstrap and tests only | `shared` |

Folders are created when their first file is, so the tree only ever shows code that exists. Import from `src` with the `@/` alias, for example `import { formatMoney } from '@/shared/lib/format'`.
