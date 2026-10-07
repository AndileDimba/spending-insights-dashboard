# 3. Test-driven development and a layered test strategy

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

This is a banking product. A wrong amount, a filter that silently drops transactions, or an injected script in a merchant name is a real incident, not a cosmetic bug. Tests written after the code tend to confirm what the code already does, rather than what the requirement says it should do. Coverage percentages alone do not prove that the tests would catch a regression.

Options considered:

1. **Test after.** Fastest to start. Tests drift towards implementation detail and gaps are found late.
2. **Test-driven development (TDD) for everything,** including layout and styling. Disciplined, but slow and low value where the output is visual and exploratory.
3. **Outside-in TDD for behaviour,** with a layered strategy where each layer has a clear job, and mutation testing to check that the tests actually catch faults.

## Decision

We use **option 3**. The detail lives in [`docs/testing-strategy.md`](../testing-strategy.md); the decision is:

- **Acceptance criteria drive the tests.** Every feature issue states its acceptance criteria as Given / When / Then. Each criterion maps to at least one test, named after it.
- **Outside-in.** Start with a failing component integration test (or a Playwright test for a critical journey) that expresses the acceptance criterion. Then drive the units underneath with red, green, refactor.
- **Bugs start with a failing test** that reproduces them. The fix is done when that test passes.
- **TDD is visible in history.** On short-lived branches, a `test(...)` commit with a failing test may precede the `feat(...)` or `fix(...)` commit that makes it pass. Branches squash-merge into `develop`, so `develop` and `main` stay green on every commit.
- **Where TDD bends:** visual layout and chart styling are built first and then covered by component, accessibility and e2e tests. We say so in the PR rather than pretend otherwise.
- **Quality gates in CI:** coverage thresholds, and mutation testing (Stryker) on money, date, filter and validation logic, where a surviving mutant means a missing test.

## Consequences

- Each acceptance criterion is traceable from the issue, to a named test, to the PR.
- Tests describe behaviour through the accessible UI (queries by role and label), so refactors do not break them and accessibility is tested for free.
- Early features take longer. The payoff is in refactoring safety and fewer regressions later.
- Red commits on feature branches mean `git bisect` should be run on `develop`, not on unmerged branches.
