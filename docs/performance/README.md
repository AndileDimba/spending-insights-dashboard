# Performance report

Measured on 13 October 2026 for #25, against the targets in [`docs/discovery/non-functional-requirements.md`](../discovery/non-functional-requirements.md).

## How it was measured

- **JavaScript budgets:** `npm run check:bundle`, which builds a production bundle and sums the gzipped JavaScript. It runs in CI on every pull request and fails above budget.
- **Lighthouse 13.5.0, mobile:** its default emulation of a mid-range phone on slow 4G (150 ms round trips, 1.6 Mbps, CPU slowed 4 times), against the Docker image running with a read-only filesystem and no capabilities, so nginx compression and caching are included. Each result was run at least twice; the reports below are one of those runs.
- **Two images.** The image the brief asks for is the **demo** build: it carries the mock API, which loads before the app renders. A **production** build (`--build-arg VITE_ENABLE_MOCKS=false`) has no mock code, and is what customers would download. Both are reported.

## Results

| ID | Target | Production image | Demo image |
| --- | --- | --- | --- |
| P1 | Largest Contentful Paint ≤ 2.5 s | **2.5 s** | 2.6 to 2.7 s |
| P3 | Cumulative Layout Shift ≤ 0.1 | **0.019** | **0.034** |
| P4 | App shell JavaScript ≤ 120 KB | **106.5 KB** | 106.5 KB, plus the mock API (34.9 KB) |
| P5 | Dashboard JavaScript with charts ≤ 250 KB | **240.5 KB** | 240.5 KB, plus the mock API |
| P6 | Lighthouse performance ≥ 90 | **95** | **90 to 91** |
| | Lighthouse accessibility 100 | **100** | **100** |

Reports: [production image](./lighthouse-production-image-mobile.html), [demo image](./lighthouse-demo-image-mobile.html). Download and open them in a browser.

Total blocking time was 10 ms (production) and 160 to 200 ms (demo). Best practices and SEO scored 100 on both.

## Reading the results honestly

- **The demo image misses P1 by 0.1 to 0.2 s, and only because of the mock API.** It starts before the first render, so the first requests are mocked. Customers never download it; the production image meets P1.
- **The production image has no backend**, so its data requests fail and the largest element is an error message. The largest element on the demo, the "Spending by category" heading, does not wait for data either, so both measure how fast the page itself arrives. In a real deployment, the API's response time adds to when the figures appear, not to the page.
- Lighthouse simulates the phone and network; a real mid-range phone on a real network is the final check (P2 says so too).

## What changed to get here

| Change | Effect |
| --- | --- |
| Each page's code loads on its own (lazy routes), and the query client and retry policy no longer import the schemas, so Zod and the API layer left the shell | Shell 139.0 KB to 106.5 KB |
| The layout renders at once on the first visit, with a loading state where the page will go | The shell paints before page code arrives |
| `modulepreload` links for the first page's chunks and the demo's mock API, so the browser fetches them alongside the shell instead of discovering them after it runs | Demo image: performance 86 to 90-91, LCP 3.5 s to 2.6-2.7 s |
| In demo builds, the public suffix list that MSW's cookie store pulls in (tldts, about 250 KB before compression) is replaced by a stand-in, since the mock API uses no cookies | Mock API 143.5 KB to 34.9 KB |

Charts were already loaded on demand (99.5 KB of Recharts).
