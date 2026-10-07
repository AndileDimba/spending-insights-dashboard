# 8. Mock the API at the network layer with MSW, including in the Docker image

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

The brief requires mocked data, and the Docker image must run the project on its own. There is no real backend. The application code should not know it is talking to mocks, so that swapping in a real API changes configuration, not components.

The same mocks are needed in three places: the development server, automated tests, and the Docker image a reviewer runs.

Options considered:

1. **Import JSON fixtures directly in components or hooks.** Simplest. The fetching, error handling, validation and caching code never runs, so the most failure-prone part of the app goes untested, and every component has to be changed when a real API arrives.
2. **A separate mock server** (for example json-server or a small Node service) run through Docker Compose. Real HTTP, but a second container and a second place where mock logic lives, and the brief asks for one runnable Dockerfile.
3. **Mock Service Worker (MSW).** Intercepts real `fetch` calls: in the browser through a service worker, and in tests through a Node interceptor. One set of handlers serves development, tests and the demo image. The application code is identical with or without it.

## Decision

Option 3.

- Handlers live in `src/mocks/`, honour every documented query parameter, and use a seeded generator so the data is realistic and deterministic. Every handler response is validated against the same Zod schemas the app uses (#11).
- Tests use MSW's Node server with unhandled requests treated as errors, and override handlers per test to force empty, error, slow and malformed responses.
- Mocking is switched on by a build-time flag. The mocks are loaded with a dynamic import behind that flag, so a build without it contains no mock code at all.
- **The Docker image is built with mocks enabled**, because the brief asks for a runnable image with mocked data. The README states clearly that this is a demo build. A real deployment builds the same Dockerfile with the flag off and points at the API.
- The service worker is served from our own origin, scoped to the app, and allowed by `worker-src 'self'` in the CSP (threat T13). The app waits for the worker to start before rendering, so the first requests are never missed.

## Consequences

- The real fetch client, Zod validation, retries, cancellation and caching run in every environment, including the demo.
- Failure modes (errors, slow responses, empty data, malformed payloads) can be demonstrated in the browser and in e2e tests, which a real backend makes hard.
- The e2e tests run against the mocks, not a real backend, so they prove the frontend against the contract, not the integration. Contract tests on the fixtures, and the optional ASP.NET Core service (ADR 0004), narrow that gap.
- A service worker in a production image is unusual and needs explaining. It is acceptable for a demo build, and the build flag keeps it out of a real deployment.
