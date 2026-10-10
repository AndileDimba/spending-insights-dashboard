# 4. Reference backend in ASP.NET Core rather than Spring Boot

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

The brief scopes an optional, stretch-only backend that serves the same API contract as the mocks (#30), so the frontend can be shown working against a real service. The job description lists Java and Spring as a nice to have, so the first plan was a Spring Boot service.

The role is a frontend role, and the assessment asks for a submission as close as possible to the role applied for. The backend is therefore a supporting piece of evidence, not the main one. Whatever is built has to be explained and defended in the interview, line by line.

The author's professional backend experience is in .NET. There is no Java toolchain on the development machine; the .NET 10 LTS SDK is installed.

Options considered:

1. **Spring Boot (Java).** Matches the nice to have in the job description. But it would be written in an unfamiliar stack, on a deadline, and be hard to defend in depth. Code that the author cannot explain undermines the rest of the submission.
2. **ASP.NET Core minimal API (.NET 10 LTS).** The author's strongest backend stack, so it can be built to the same standard as the frontend (tests, validation, security headers, container) and discussed in depth. It does not match the Java preference.
3. **Node with Express or Fastify.** Same language as the frontend and could share the Zod schemas. Shows the least additional range, and sharing code across the boundary would blur the contract this project treats as the source of truth.
4. **No backend.** Lowest cost. The mocks already exercise the contract at the network layer. Loses the chance to show the frontend running against a real service.

## Decision

If the stretch backend is built, it is an **ASP.NET Core minimal API on .NET 10 LTS**, implementing exactly the contract in `docs/brief/api-spec.md`.

- Errors use RFC 9457 Problem Details, which both ASP.NET Core and Spring support natively, so the frontend's error handling does not depend on the backend stack.
- Contract tests reuse the same JSON fixtures as the frontend, so both sides are checked against one definition of the contract.
- It ships in its own container and runs with the frontend through Docker Compose.

## Consequences

- The submission does not show Java. This is a deliberate trade-off: depth in a stack the author can defend is worth more than breadth in one they cannot, especially for a nice to have on a frontend role.
- The frontend is unaffected by the choice. It talks to an HTTP contract, not a language, and the same contract tests would apply to a Spring service. A team standardised on Java could replace this service without touching the frontend, which is itself a point in favour of the contract-first approach.
- The choice remains stretch scope. It is built only after every must have is polished, and option 4 is the fallback if time runs out.
