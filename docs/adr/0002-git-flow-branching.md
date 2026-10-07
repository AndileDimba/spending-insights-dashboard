# 2. Git Flow branching with pull requests

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

This project has one engineer, but it is meant to show how work is done in a team building a banking product. In that setting, every change to production is reviewed, traceable and reversible, and production fixes can ship without waiting for unfinished features.

Options considered:

1. **Trunk-based development** (short-lived branches into `main`, feature flags). Excellent for teams with mature CI/CD and continuous deployment. Less visible structure for a reviewer reading the history of a small project.
2. **GitHub Flow** (feature branches into `main`). Simple, but has no separate release stabilisation step and no distinct hotfix path.
3. **Git Flow** (`main`, `develop`, `feature/*`, `bugfix/*`, `release/*`, `hotfix/*`). More ceremony, but gives explicit release and hotfix paths and keeps `main` equal to what is in production.

## Decision

Use **Git Flow**, with every merge into `develop` or `main` going through a GitHub pull request.

- `feature/*`, `bugfix/*` and supporting branches squash-merge into `develop`.
- `release/*` and `hotfix/*` merge into `main` with a merge commit, are tagged `vX.Y.Z`, and are back-merged into `develop`.
- Local hooks in `.githooks/` and GitHub branch protection block direct commits and pushes to `main` and `develop`.
- Commit messages follow Conventional Commits.

## Consequences

- History and PRs show a clear, reviewable path for every change.
- `main` always reflects a released, tagged version.
- More overhead than trunk-based development. In a team with continuous deployment we would likely move to trunk-based development with feature flags; this trade-off is a good discussion point rather than a fixed belief.
