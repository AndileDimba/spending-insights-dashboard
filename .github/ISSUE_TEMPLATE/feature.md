---
name: Feature
about: A user story, refined until it is ready to build
title: "feat: "
labels: feature
---

## User story

As a customer, I want ... so that ...

## Acceptance criteria

<!-- One scenario per behaviour. Each becomes at least one test, named after it. -->

```gherkin
Scenario: ...
  Given ...
  When ...
  Then ...
```

## States

- Loading:
- Empty:
- Error:

## API endpoints involved

-

## Security and data considerations

<!-- Untrusted fields rendered, URL parameters accepted, anything sensitive shown. -->

-

## Out of scope

-

## Definition of ready

- [ ] Acceptance criteria are written as testable scenarios
- [ ] Loading, empty and error behaviour is described
- [ ] API gaps are recorded in `docs/api-assumptions.md`
- [ ] Small enough to deliver in one PR (roughly 400 changed lines or fewer)
