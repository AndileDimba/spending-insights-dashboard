# 1. Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

Decisions made while building this project need to be explainable later, to reviewers and to future maintainers. Decisions that live only in someone's head or in chat history are lost.

## Decision

We record significant decisions as Architecture Decision Records (ADRs) in `docs/adr/`, using the format described by Michael Nygard: context, decision, consequences.

- Files are numbered sequentially: `NNNN-short-title.md`.
- An ADR is never edited after it is accepted, except to change its status. A changed decision gets a new ADR that supersedes the old one.
- A decision is "significant" if it is hard to reverse, affects structure, or a reasonable engineer could have chosen differently.

## Consequences

- Reviewers can see why the project looks the way it does, not only what it does.
- Writing an ADR adds a little overhead to each significant decision. That is the point: it forces the trade-off to be thought through.
