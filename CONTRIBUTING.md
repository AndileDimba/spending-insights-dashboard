# Contributing

This project follows the workflow a professional product team would use, even though it currently has a single engineer. The goal is a history and a set of pull requests that show how each change was planned, built, reviewed and released.

## Branching model

We use Git Flow.

```text
main      o-----------------------o-----------o----------->   (tagged releases only)
           \                     / \         /
hotfix/     \                   /   o-------o                 hotfix/1.0.1-*
             \                 /             \
release/      \           o---o               \               release/1.0.0
               \         /     \               \
develop         o---o---o-------o---------------o--------->
                     \ /
feature/              o                                       feature/12-transactions-table
```

### Long-lived branches

- **`main`** holds production-ready code. Every commit on `main` is a release and carries an annotated tag (`v1.0.0`). Nobody commits here directly.
- **`develop`** is the integration branch. It should always build and pass tests. Nobody commits here directly.

### Short-lived branches

| Prefix | Use for | Base | Target |
| --- | --- | --- | --- |
| `feature/` | New functionality | `develop` | `develop` |
| `bugfix/` | Bugs found before release | `develop` | `develop` |
| `release/` | Preparing a release | `develop` | `main`, then back-merge to `develop` |
| `hotfix/` | Urgent fixes to production | `main` | `main`, then back-merge to `develop` |
| `chore/`, `docs/`, `ci/`, `build/`, `perf/`, `refactor/`, `test/` | Supporting work | `develop` | `develop` |

Naming: `<prefix>/<issue-number>-<kebab-case-summary>`, for example `feature/7-category-breakdown-chart` or `bugfix/21-currency-rounding`. Release and hotfix branches use the version: `release/1.1.0`, `hotfix/1.0.1-fix-csp-header`.

## Ways of working

Work is planned the way an agile team plans a sprint: the [roadmap](docs/roadmap.md) is the backlog, each milestone is an iteration that ends in a tagged release, and each line in it becomes a GitHub issue.

### Definition of ready

An issue can be picked up when:

- it has a user story and acceptance criteria written as Given / When / Then scenarios
- loading, empty and error behaviour is described
- API gaps it touches are recorded in [`docs/api-assumptions.md`](docs/api-assumptions.md)
- it fits in one PR (roughly 400 changed lines or fewer); otherwise it is split

### Definition of done

A change is done when:

- every acceptance criterion has a passing test named after it
- loading, empty and error states are handled
- it works at 360px, tablet and desktop widths, and by keyboard alone, with no axe violations
- lint, typecheck, tests, coverage thresholds and the Docker build pass in CI
- docs (README, ADRs, `docs/api-assumptions.md`) are updated where relevant
- the PR template is complete and the PR is merged

### Test-driven development

We work test-first, as described in [ADR 0003](docs/adr/0003-test-driven-development.md) and [`docs/testing-strategy.md`](docs/testing-strategy.md). Start each acceptance criterion with a failing test, make it pass, then refactor. Bugs start with a failing test that reproduces them.

## Day-to-day flow

### Feature or bugfix

```bash
git switch develop
git pull --ff-only
git switch -c feature/7-category-breakdown-chart

# red: a failing test for one acceptance criterion
git commit -m "test(categories): show categories sorted by amount, largest first"

# green: the smallest change that passes, then refactor with tests green
npm run lint && npm run typecheck && npm test
git commit -m "feat(categories): sort category breakdown by amount"

git push -u origin feature/7-category-breakdown-chart
gh pr create --base develop --fill
```

A failing `test(...)` commit is allowed on a feature or bugfix branch only when the next commit makes it pass. Every other commit leaves lint, typecheck and tests green.

Merge into `develop` with **squash merge** once CI is green and the checklist is complete, then delete the branch. The squashed commit message must follow Conventional Commits. Squash merging keeps `develop` green on every commit, while the PR keeps the red, green, refactor history for reviewers.

### Release

```bash
git switch develop && git pull --ff-only
git switch -c release/1.0.0
# bump version in package.json, update CHANGELOG.md, last fixes only
git push -u origin release/1.0.0
gh pr create --base main --title "release: v1.0.0"
```

After merging into `main` (**merge commit**, not squash, so the release is traceable):

```bash
git switch main && git pull --ff-only
git tag -a v1.0.0 -m "v1.0.0"
git push origin v1.0.0
gh pr create --base develop --head main --title "chore: back-merge v1.0.0 into develop"
```

### Hotfix

```bash
git switch main && git pull --ff-only
git switch -c hotfix/1.0.1-fix-csp-header
# fix, test, bump patch version, update CHANGELOG.md
gh pr create --base main
# after merge: tag v1.0.1 on main, then back-merge main into develop
```

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(<scope>): <imperative summary>

<why this change was needed, and anything non-obvious>

Refs: #<issue>
```

| Type | When |
| --- | --- |
| `feat` | New user-facing behaviour |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or fixing tests |
| `build` | Build system, dependencies, Docker |
| `ci` | CI configuration |
| `chore` | Maintenance |
| `revert` | Reverting a previous commit |

Breaking changes add `!` after the type (`feat(api)!: ...`) and a `BREAKING CHANGE:` footer.

## Pull requests

- One concern per PR. Aim for under 400 changed lines.
- Fill in the PR template completely, including screenshots for UI changes (mobile and desktop).
- CI must pass. [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs these as required checks on every PR:
  - **PR conventions:** the title is a Conventional Commit (it becomes the squash commit message) and the branch name follows the convention
  - **Lint and format:** `npm run lint` and `npm run format:check`
  - **Typecheck:** `npm run typecheck`
  - **Unit tests:** `npm run test:coverage`, with the coverage report attached to the run
  - **Build:** `npm run build`
  - **Docker image:** builds the image, runs it read-only as non-root and runs `scripts/docker-smoke-test.sh`

  [`.github/workflows/security.yml`](.github/workflows/security.yml) adds, on every PR and weekly:
  - **Dependency audit:** `npm audit --audit-level=high` and `npm audit signatures`
  - **CodeQL:** security analysis of the TypeScript and of the workflows
  - **Image scan:** Trivy fails on fixable high or critical vulnerabilities and reports all findings to the Security tab

  E2E tests join in #23.

  Found a vulnerability? Follow [`SECURITY.md`](SECURITY.md), not a public issue.
- Review your own diff on GitHub before requesting review. Leave comments on anything a reviewer might question.

## Adding a dependency

Every dependency is code we ship or run, so it needs a reason. In the PR, say why it is needed and why existing code or the platform is not enough. If it is a meaningful architectural choice, add an ADR.

- Versions are saved exactly ( in ) and the lockfile is committed.
- Unknown command: "audit"


Did you mean this?
  npm audit # Run a security audit
To see a list of supported npm commands, run:
  npm help must stay clean at high and critical severity. CI enforces this.
- Install scripts from dependencies are blocked by default (npm 11.19 and later) and are not run in CI. If a new dependency has one, decide explicitly:  if it is not needed, or  with the reason in the PR. The decision is recorded in  in .

## Versioning

[Semantic Versioning](https://semver.org/). `CHANGELOG.md` follows [Keep a Changelog](https://keepachangelog.com/).

## Local guard rails

`scripts/init-repo.ps1` sets `core.hooksPath` to `.githooks`, which:

- blocks commits directly on `main` and `develop`
- blocks pushes to `main` and `develop`
- rejects branch names that do not follow the convention
- rejects commit messages that are not Conventional Commits
- lints (zero warnings), formats and typechecks staged files with lint-staged, and refuses to commit if dependencies are not installed

ESLint also enforces the architecture boundaries from [ADR 0006](docs/adr/0006-feature-folders.md): relative imports stay inside their own feature or shared segment, and imports flow from `app` to `features` to `shared`. If the linter blocks an import, the fix is usually to import from a feature's `index.ts` or to move shared code into `src/shared/`.

On GitHub, protect `main` and `develop`: require a pull request, require status checks to pass, disallow force pushes and deletions.
