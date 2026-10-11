# 15. Host the demo on Vercel at insights.dimba.co.za

- **Status:** Accepted
- **Date:** 2026-10-10

## Context

The Docker image (ADR 0012) is the way reviewers run the project, but asking friends and testers to install Docker stops most of them from trying it at all. A public link makes it easy to collect real feedback before submission.

The demo build contains the mock API (ADR 0008), so it is static files only: there is no backend to host. The author already runs personal apps on Vercel under `dimba.co.za`, with DNS on Cloudflare.

Options considered:

1. **No hosted demo.** Docker only. No new moving parts, but almost no outside feedback.
2. **GitHub Pages.** Free and close to the code, but it cannot set response headers, so the Content Security Policy and security headers from the threat model would be missing, and the repository path needs router and worker configuration.
3. **Netlify or Cloudflare Pages.** Both can set headers; neither is already in use.
4. **Vercel,** on a subdomain of the author's own domain. Headers and rewrites are set in `vercel.json`, deploys come from the GitHub integration, and pull requests get preview links.

## Decision

Option 4, at `insights.dimba.co.za`.

- `vercel.json` mirrors `nginx/default.conf`: the same Content Security Policy and security headers on every response, immutable caching for hashed assets, `no-cache` for the app shell, and a fallback to the app for client-side routes that never answers a missing asset, a source map or a dotfile with the app. The health check is a static `public/healthz` file, because Vercel has no equivalent of nginx's `return 200`; nginx's exact-match location still answers first in the Docker image.
- The build sets `VITE_ENABLE_MOCKS=true` in `vercel.json` itself, so the demo cannot silently become a build without its API, and installs with `--ignore-scripts`, as CI does.
- **Production deploys from `main`**, so the live site is always the latest tagged release. Pull requests get preview deployments.
- The Docker smoke test (`scripts/docker-smoke-test.sh`) runs against the hosted site too, so the two runtimes are held to the same checks.

## Consequences

- Testers need only a link, and their feedback can arrive as GitHub issues.
- There are now two runtimes to keep in step, nginx and Vercel. The shared smoke test is what keeps them honest; a header added to one and not the other fails it.
- Vercel adds HSTS on its own domain setup, which nginx leaves to the ingress (ADR 0012).
- Vercel's preview deployments are protected by Vercel sign-in by default. Testers can use the production link; preview links need that protection relaxed per project if they are to be shared.
