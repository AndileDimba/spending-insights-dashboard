# Non-functional requirements

What "production-grade" means for this dashboard, written before any code so that later decisions can be checked against it. Each requirement is measurable and names how it is verified. The issue that delivers the verification is linked in brackets.

Customers use a banking app on whatever phone they own, often on a mobile network. The requirements below assume a mid-range Android phone on a 4G connection as the normal case, not a developer laptop.

## Performance

Measured with Lighthouse mobile emulation against the Docker image, so nginx compression and caching are included.

| ID | Requirement | Target | Verified by |
| --- | --- | --- | --- |
| P1 | Largest Contentful Paint | 2.5 s or less | Lighthouse report (#25) |
| P2 | Interaction to Next Paint | 200 ms or less | Lighthouse report, manual check on a mid-range phone (#25) |
| P3 | Cumulative Layout Shift | 0.1 or less. Skeletons match the size of the content they replace | Lighthouse report (#25), component tests for skeletons |
| P4 | JavaScript for the app shell, before any chart code | 120 KB gzipped or less | Bundle check (#25) |
| P5 | Total JavaScript for the dashboard route, charts included | 250 KB gzipped or less | Bundle check (#25) |
| P6 | Lighthouse performance score (mobile) | 90 or more | Lighthouse report (#25) |
| P7 | Changing filters or pages does not blank the screen | Previous data stays visible until new data arrives | Component tests (#21, #22) |

The first three are Google's Core Web Vitals "good" thresholds. The bundle budgets exist because a dashboard with charts can easily grow past what a mid-range phone parses quickly; chart code is loaded separately from the shell so the page structure and summary appear first.

## Accessibility

| ID | Requirement | Verified by |
| --- | --- | --- |
| A1 | WCAG 2.2 level AA | Axe in component tests (#5) and on every page in e2e (#23), manual checks below |
| A2 | Every feature works with a keyboard alone, with a visible focus indicator that is never hidden behind sticky content (WCAG 2.4.7, 2.4.11) | Keyboard-only e2e journey (#23) |
| A3 | Content reflows without loss at 320 CSS pixels wide and at 200% zoom (WCAG 1.4.10, 1.4.4). We design for 360px, but must not break below it | e2e at 320px (#23), manual zoom check |
| A4 | Text and meaningful graphics meet contrast ratios of 4.5:1 and 3:1 in light and dark themes | Axe (#13), token review (#13) |
| A5 | Charts never convey meaning by colour alone, and every chart has an equivalent table or list | Component tests (#17, #18) |
| A6 | Pointer targets are at least 24 by 24 CSS pixels (WCAG 2.5.8) | Design token review, manual check |
| A7 | Animation respects `prefers-reduced-motion` | Component test (#13) |
| A8 | Manual screen reader pass with NVDA on Windows and VoiceOver on iOS before each release | Release checklist (#27) |

## Browser and device support

| ID | Requirement | Verified by |
| --- | --- | --- |
| B1 | Browsers in Baseline Widely Available: Chrome and Edge 111+, Firefox 114+, Safari and iOS Safari 16.4+, and Chromium-based browsers such as Samsung Internet of the same vintage | Vite `build.target` in `vite.config.ts` (#3), e2e on Chromium and WebKit (#23) |
| B2 | Viewports from 320px to 1920px wide, portrait and landscape | e2e mobile and desktop projects (#23) |
| B3 | No horizontal page scroll at any supported width | e2e assertion (#13, #23) |

Internet Explorer and legacy Edge are not supported. Their usage is negligible, and supporting them would cost bundle size for every other customer.

## Resilience

| ID | Requirement | Verified by |
| --- | --- | --- |
| R1 | Every data view handles loading, empty, error and success | Component tests in every feature issue |
| R2 | One failing endpoint never blanks the whole page; each view fails and retries on its own | Component tests, e2e error journey (#23) |
| R3 | Requests time out after 10 seconds | API client tests (#12) |
| R4 | Network errors and 5xx responses are retried at most twice with backoff; 4xx and invalid data are not retried | API client tests (#12) |
| R5 | A rendering error in one view is contained by an error boundary with a retry | Component test (#13) |
| R6 | Invalid API data produces an error state, never a wrong or `NaN` value on screen | Contract and component tests (#10, #12) |

## Security

The threats and their mitigations are in [`threat-model.md`](./threat-model.md). The headline requirements:

| ID | Requirement | Verified by |
| --- | --- | --- |
| S1 | A Content Security Policy with no `unsafe-inline` or `unsafe-eval` for scripts | e2e header test and CSP violation listener (#7, #23) |
| S2 | No dependency or image vulnerability rated HIGH or CRITICAL at release | `npm audit` and Trivy in CI (#8) |
| S3 | All API data and URL parameters are validated before use | Contract tests, URL tampering tests (#10, #15, #21) |
| S4 | The container runs as a non-root user | Docker test (#7) |
| S5 | No secrets in the repository or the image | CodeQL and secret scanning (#8) |

## Privacy

The bank is subject to the Protection of Personal Information Act (POPIA), so the frontend collects and exposes as little personal information as it can.

| ID | Requirement | Verified by |
| --- | --- | --- |
| PR1 | No personal information (name, email, customer ID) in URLs, page titles or logs | e2e and component tests (#14, #23) |
| PR2 | Financial data is held in memory only, never written to `localStorage`, `sessionStorage` or IndexedDB | Code review, lint rule where practical |
| PR3 | No third-party scripts, fonts, analytics or trackers. Everything is served from our own origin | CSP (#7) |
| PR4 | The profile header shows only what it needs (no email address) | Component test (#14) |

## Localisation

| ID | Requirement | Verified by |
| --- | --- | --- |
| L1 | Money is formatted with `Intl.NumberFormat('en-ZA')` in the profile currency (for example `R 1 250,30`, where the spaces are non-breaking, so tests compare against the formatter rather than a hand-typed string). All formatting lives in one module, so supporting another locale is a change in one place | Unit tests (#10 onwards) |
| L2 | Dates and times are shown in the `Africa/Johannesburg` time zone, regardless of the device setting, so the app agrees with bank statements | Unit tests with a fixed clock |
| L3 | Copy uses plain South African English | PR review |

## Observability

| ID | Requirement | Verified by |
| --- | --- | --- |
| O1 | Errors from the API client and error boundaries go through one logger interface. It writes to the console in development and can be pointed at a monitoring service without code changes elsewhere | Unit tests (#12, #13) |
| O2 | Logged errors contain no personal or financial data | Unit tests (#12) |
| O3 | Core Web Vitals are reported through the same logger | Unit test (#25) |

No monitoring service is wired up in this project, because there is nowhere to send the data. The logger interface is the seam where one would be added.

## Maintainability and delivery

| ID | Requirement | Verified by |
| --- | --- | --- |
| M1 | TypeScript `strict`, no `any`, zero lint warnings | CI (#4, #6) |
| M2 | Coverage of 80% overall and 95% on `src/shared/lib` and `src/shared/api`; mutation score of 75% on the same folders | CI (#5, #24) |
| M3 | A new engineer can build, run and test the project using only the README | README review (#26) |
| M4 | The production image builds from a clean checkout with one command, and is under 60 MB | CI Docker build (#7) |
