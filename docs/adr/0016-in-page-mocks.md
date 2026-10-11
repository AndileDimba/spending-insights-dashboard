# 16. Mock the API inside the page, not in a service worker

- **Status:** Accepted. Supersedes the browser part of ADR 0008.
- **Date:** 2026-10-11

## Context

ADR 0008 mocks the API with MSW, and in the browser MSW answered requests from a service worker. Two testers hit the same failure on the live demo (#78):

- A tab left open overnight in Chrome showed no data until it was refreshed.
- On an iPhone, paging through transactions showed "We received information that could not be shown".

The cause is in how MSW's worker tracks pages. The page tells the worker once, at start-up, to mock its requests, and the worker keeps that only in memory. Browsers stop idle service workers: Chrome after about 30 seconds without events (a frozen background tab sends none), and iOS Safari much sooner, for example when the user switches apps. The restarted worker has forgotten the page, so API requests go to the network. The demo host answers `/api/...` with the app's HTML, which fails validation.

The failure needed a real browser to reproduce, so the Playwright foundation (#23) came first. A Chromium test stops the worker through the DevTools protocol and pages on; it failed with the same error.

Options considered:

1. **Restart the worker when the tab becomes visible again,** then refetch. A small change, but it cannot help when iOS stops the worker while the tab is open, which is what the tester hit.
2. **Intercept `fetch` in the page.** MSW 3 can run its handlers against an in-page fetch interceptor (`defineNetwork` with an `InterceptorSource` from `msw/experimental`, and `FetchInterceptor` from `@mswjs/interceptors`). There is no worker to stop, so the mocks live exactly as long as the page.
3. **Both:** in-page on the hosted demo, the worker in development and Docker. Two code paths to maintain and test.

## Decision

Option 2, in every browser build that has mocks: the dev server, the Docker image and the Vercel demo.

- `src/mocks/browser.ts` patches `fetch` with the same handlers as before. The app code, the fetch client, Zod validation, retries and caching are unchanged, so everything ADR 0008 set out to prove still runs.
- The MSW Vite plugin and `mockServiceWorker.js` are gone. nginx answers that path with a plain 404 (Vercel already does), never the app, and the page unregisters the old worker for returning visitors.
- `@mswjs/interceptors` becomes a direct dev dependency at the version MSW itself uses, so there is still one copy.
- Tests are unaffected: they already used MSW's Node interceptor.

## Consequences

- The demo cannot lose its mocks while the page is open, in any browser. The e2e test that stops service workers passes.
- `msw/experimental` is marked experimental. It is the API MSW 3's own `setupWorker` is built on, and it is used only in demo builds, never in a real deployment. A breaking change would show up in the e2e tests on the Dependabot PR that brings it.
- Mocked requests no longer appear in the browser's Network panel, because they never leave the page. The query devtools and the console are the way to inspect them.
- A real build still contains no mock code; the CI check is unchanged.
- The CSP still allows `worker-src 'self'`, which nothing now needs. Tightening it changes nginx, `vercel.json`, the smoke test and the threat model together, so it is a separate change.
