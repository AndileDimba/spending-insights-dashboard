# 5. React single-page app built with Vite and strict TypeScript

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

The dashboard sits behind a customer's sign-in, so search engines never see it and server rendering brings no SEO benefit. It must ship as a Docker image that is simple to run, and the role builds React frontends. The brief asks for production-grade code, which in a large codebase means the compiler should catch as much as possible.

Options considered:

1. **Next.js.** Server rendering and React Server Components can improve first paint. It needs a Node server in production, which adds runtime surface, memory and operational work, for an authenticated page that gains little from it.
2. **React Router in framework mode.** Similar trade-off to Next.js: valuable for server rendering and data loading on the server, heavier than this app needs.
3. **A client-rendered React app built with Vite.** Builds to static files that any web server can serve. Fast development server and a standard plugin ecosystem.

For the language, plain JavaScript was not seriously considered: in a banking codebase, types are the cheapest way to stop a whole class of bugs reaching review.

## Decision

A client-rendered React single-page app, built with Vite, written in TypeScript with `strict` and additional checks (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`). No `any`. Function components and hooks only.

## Consequences

- The production artefact is static files served by nginx, which keeps the runtime small and the attack surface low (see ADR 0012).
- Nothing renders until JavaScript loads. This is managed with the performance budgets in the NFRs, route-level code splitting and skeletons, and measured in #25.
- If public, indexable pages were added later, server rendering would be worth revisiting for those pages.
- Strict compiler options cost a little ceremony, for example handling `undefined` from array lookups, in exchange for bugs caught at compile time.
