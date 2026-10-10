# 12. Serve the build from unprivileged nginx with security headers

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

The brief requires a runnable Dockerfile. The app builds to static files (ADR 0005), so the runtime only has to serve files, fall back to `index.html` for client-side routes, cache correctly and send the security headers defined in the threat model. Every extra component in the runtime image is something to patch and something an attacker can use.

Options considered:

1. **A Node server** (`serve`, Express). Familiar, but brings a full Node runtime and its dependencies into production to serve static files.
2. **Caddy.** Simple configuration and automatic TLS. TLS is handled by the ingress here, and nginx is more common in enterprise platforms, so more operators already know it.
3. **The official nginx image.** Standard, but its master process starts as root and it listens on port 80.
4. **The nginx unprivileged image** (`nginxinc/nginx-unprivileged`). The same nginx, running as a non-root user on port 8080.
5. **A distroless or scratch image** with a static file server. Smallest surface, but harder to debug and less familiar to most teams.

## Decision

Option 4, in a multi-stage Dockerfile:

- **Build stage:** Node LTS on Alpine, `npm ci` from the lockfile, then the production build.
- **Runtime stage:** `nginxinc/nginx-unprivileged` on Alpine, containing only the built files and our nginx configuration.
- nginx serves the SPA with an `index.html` fallback for client routes, long-lived immutable caching for hashed assets, `no-cache` for `index.html`, and compression.
- nginx sends the headers from the threat model on every response: Content Security Policy, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` and `Cross-Origin-Opener-Policy`. The server version is hidden.
- The image has a `HEALTHCHECK`, and source maps are not served.
- TLS and HSTS belong to the ingress or load balancer in front of the container, as in most bank platforms, so they are not configured here.

## Consequences

- The container runs as non-root with a small, well-understood runtime, and a Trivy scan in CI watches it (#8).
- Security headers are set in one place and apply to every response, including errors, and e2e tests assert them (#23).
- The Content Security Policy is strict, so any inline script or third-party resource fails loudly in development and in e2e, which is the intent.
- Configuration that changes per environment, such as an API base URL, is baked in at build time. If one image had to serve several environments, runtime configuration (for example a `config.json` served by nginx) would be the next step.
