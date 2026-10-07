# Threat model

A lightweight threat model for the dashboard, using STRIDE. It is written before the code so that security is designed in, and every mitigation points at the test or issue that proves it. It should be revisited whenever a trust boundary changes, for example when real authentication or a real API replaces the mocks.

## What we are protecting

- **Customer financial data:** transactions, balances, spending patterns and budgets. Highly sensitive: it reveals where someone lives, shops and travels.
- **Customer identity:** name, email and customer ID.
- **The customer's session and browser:** an attacker who runs script in the page can read everything above and act as the customer.
- **The integrity of what we display:** a wrong amount in a banking app causes real decisions and real complaints, even with no attacker involved.

## System overview

```text
                 TB4: supply chain (npm, base images, GitHub Actions)
                                      |
                                      v
+-----------------------+   TB3   +-----------------------+   TB1   +-----------------------+
|  Customer's browser   | <-----> |  nginx (container)    |         |  Spending API         |
|  React SPA            |  HTML,  |  static files,        |         |  (MSW in this project,|
|  TanStack Query cache |  JS,    |  security headers,    |         |   a real service in   |
|  (memory only)        |  CSS    |  CSP, non-root        |         |   production)         |
+-----------------------+         +-----------------------+         +-----------------------+
     ^            |                                                          |
     | TB2        +------------------------- JSON over HTTPS ---------------+
     |
 URL, query string, form input, pasted links
```

| Boundary | Between | What crosses it |
| --- | --- | --- |
| TB1 | API and browser | JSON responses, which we treat as untrusted |
| TB2 | User and app | URL query parameters, form input, shared links |
| TB3 | Server and browser | The application code and the headers that constrain it |
| TB4 | Third parties and build | Dependencies, container base images, CI actions |

## Assumptions

- In production, authentication is handled by the bank's existing platform, for example a backend-for-frontend that holds the session in an `HttpOnly`, `Secure`, `SameSite` cookie. This project has a single mocked customer and no login (see `docs/api-assumptions.md`).
- TLS is terminated at the ingress in front of the container, which also sends HSTS.
- Authorisation (can this session see this `customerId`?) is enforced by the API. The frontend never relies on hiding data for security.

## Threats and mitigations

| ID | STRIDE | Threat | Mitigation | Verified by |
| --- | --- | --- | --- | --- |
| T1 | Elevation of privilege | **Cross-site scripting** through API strings such as merchant name or description | React escapes text by default. `dangerouslySetInnerHTML` is banned by lint. CSP allows scripts from our own origin only | Injection test with `<img src=x onerror=...>` (#20), lint rule (#4), CSP e2e (#23) |
| T2 | Tampering | **CSS injection** through API colours, which we use in inline styles | Colours are validated as `#RRGGBB` at the boundary, with a design token fallback | Contract test (#10), component test (#17) |
| T3 | Tampering | **Malformed or malicious API responses** (wrong types, `NaN`, huge numbers, unknown enum values) | Zod validation at the API boundary. Invalid data becomes an error state | Contract tests (#10), client tests (#12) |
| T4 | Tampering | **URL parameter tampering** (`?limit=100000`, `?category=<script>`, `?period=999d`) | All query parameters are parsed with schemas, clamped to contract limits and fall back to safe defaults. Only known categories are sent to the API | URL tampering tests (#15, #21, #22) |
| T5 | Elevation of privilege | **Clickjacking**: the app framed by a hostile site | `frame-ancestors 'none'` in the CSP | Header test (#7, #23) |
| T6 | Information disclosure | **Personal data leaking** through URLs, page titles, referrer headers or logs | No personal data in URLs or titles. `Referrer-Policy: strict-origin-when-cross-origin`. The logger strips personal and financial data | Tests (#12, #14, #23) |
| T7 | Information disclosure | **Financial data persisted on a shared device** | Query cache in memory only. Nothing financial is written to browser storage | NFR PR2, code review |
| T8 | Information disclosure | **Third-party scripts** reading the page (analytics, fonts, CDNs) | None are used. CSP restricts every resource type to our own origin | CSP e2e (#23) |
| T9 | Information disclosure | **Source maps or verbose errors** exposing internals | Source maps are not served in production. Users see plain-language errors, never raw server output | Docker test (#7), client tests (#12) |
| T10 | Tampering | **Compromised dependency or base image** | Lockfile with `npm ci`, `npm audit` gate, Dependabot, Trivy image scan, minimal runtime image | CI (#6, #8) |
| T11 | Tampering | **Compromised CI action** | Third-party actions pinned to commit SHAs. Workflows run with read-only permissions and no secrets | CI review (#6) |
| T12 | Elevation of privilege | **Container breakout or misuse** | Unprivileged nginx on port 8080, no shell tools beyond the base image, read-only friendly config | Docker test (#7) |
| T13 | Tampering | **The mock service worker in the production image** intercepting requests | MSW is enabled only by an explicit build flag for the demo image, its scope is limited to the API path, and the trade-off is recorded in an ADR | ADR (#2), Docker test (#7) |
| T14 | Tampering | **CSV formula injection** in exported transactions | Cells starting with `=`, `+`, `-` or `@` are escaped | Unit test (#29) |
| T15 | Denial of service | **Oversized responses** freezing a phone | Page size capped at 100, trends at 24 months, both enforced on the client too | Tests (#10, #22) |
| T16 | Repudiation | Disputes about what a customer did | Not applicable to a read-only client. Audit logging is the API's responsibility | n/a |
| T17 | Spoofing | **Session theft** | Out of scope here (no auth). In production, tokens never live in JavaScript-readable storage, which is why T1 matters so much | Assumption above |

## Security headers

Sent by nginx (#7) and asserted in e2e (#23):

| Header | Value | Why |
| --- | --- | --- |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'` | Limits the damage of any injection to nothing it can load or send. `worker-src` allows the mock service worker |
| `X-Content-Type-Options` | `nosniff` | Stops browsers from guessing content types |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | No paths or query strings leak to other sites |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` | The app needs none of these |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isolates the window from cross-origin popups |

Inline styles generated by the chart library may need `style-src` adjustments. If so, the change and its reason are recorded in the PR for #17, and scripts stay strict.

## Residual risks

- **No real authentication.** The biggest gap between this project and production, accepted because the brief is a frontend with mocked data.
- **The demo image contains mocks.** Acceptable for an assessment. A real deployment would build without them and point at the API.
- **Client-side validation is not a security control for the server.** It protects the customer's screen, not the backend, which must validate independently.
