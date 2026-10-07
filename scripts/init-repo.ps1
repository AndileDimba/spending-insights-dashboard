<#
.SYNOPSIS
    One-time bootstrap for the repository: git init, initial commit on main,
    develop branch, local hooks, and optionally the public GitHub repo with
    branch protection.

.DESCRIPTION
    The initial commit is the only commit ever made directly on main. After
    this script runs, the hooks in .githooks block direct commits and pushes
    to main and develop, and all work goes through branches and pull requests.

.EXAMPLE
    .\scripts\init-repo.ps1
    .\scripts\init-repo.ps1 -CreateGitHubRepo
#>
[CmdletBinding()]
param(
    [switch]$CreateGitHubRepo,
    [string]$RepoName = "spending-insights-dashboard"
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)

function Invoke-Git {
    git @args
    if ($LASTEXITCODE -ne 0) { throw "git $args failed" }
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw "git is not installed." }
if (Test-Path ".git") { throw "This folder is already a git repository. Nothing to do." }

$name = git config --global user.name
$email = git config --global user.email
if (-not $name -or -not $email) {
    throw "Set git user.name and user.email first (git config --global ...)."
}
Write-Host "Committing as $name <$email>" -ForegroundColor Cyan

# 0. Move bootstrap files into .claude and .github, then remove the staging folder
$bootstrap = "scripts/bootstrap"
if (Test-Path $bootstrap) {
    New-Item -ItemType Directory -Force -Path ".claude", ".github" | Out-Null
    Copy-Item "$bootstrap/claude/*" ".claude" -Recurse -Force
    Copy-Item "$bootstrap/github/*" ".github" -Recurse -Force
    Remove-Item $bootstrap -Recurse -Force
}

# 1. Initialise with main as the default branch
Invoke-Git init -b main

# 2. Initial commit on main (the only direct commit to main, ever)
Invoke-Git add -A
Invoke-Git update-index --chmod=+x .githooks/pre-commit .githooks/commit-msg .githooks/pre-push
Invoke-Git commit -m "chore: initial repository setup" -m "Adds CLAUDE.md, contribution guide, Git Flow hooks, ADRs, testing strategy, roadmap, project brief, API contract and MIT licence."

# 3. Create develop from main
Invoke-Git branch develop

# 4. Activate local guard rails
Invoke-Git config core.hooksPath .githooks
Invoke-Git config pull.ff only
Invoke-Git config fetch.prune true

# 5. Optional: create the public GitHub repo and protect branches
if ($CreateGitHubRepo) {
    if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { throw "GitHub CLI (gh) is not installed." }
    gh auth status
    if ($LASTEXITCODE -ne 0) { throw "Run 'gh auth login' first." }

    gh repo create $RepoName --public --source . --remote origin `
        --description "Responsive customer spending insights dashboard (React, TypeScript)"
    if ($LASTEXITCODE -ne 0) { throw "gh repo create failed" }

    # One-time bootstrap push of the protected branches
    $env:ALLOW_PROTECTED_PUSH = "1"
    try {
        Invoke-Git push -u origin main
        Invoke-Git push -u origin develop
    }
    finally {
        Remove-Item Env:ALLOW_PROTECTED_PUSH
    }

    $owner = gh api user --jq .login

    # develop as the default branch so PRs target it by default
    gh repo edit "$owner/$RepoName" --default-branch develop --delete-branch-on-merge `
        --enable-squash-merge --enable-merge-commit --enable-rebase-merge=false

    # Branch protection: PR required, no force pushes, no deletions.
    # Required status checks are added once CI exists.
    $protection = @'
{
  "required_status_checks": null,
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 0,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
'@
    foreach ($branch in @("main", "develop")) {
        $protection | gh api -X PUT "repos/$owner/$RepoName/branches/$branch/protection" --input -
        if ($LASTEXITCODE -ne 0) { Write-Warning "Could not protect $branch. Set it manually in GitHub settings." }
    }

    Write-Host "GitHub repo ready: https://github.com/$owner/$RepoName" -ForegroundColor Green
}

# 6. Start work on develop
Invoke-Git switch develop

Write-Host ""
Write-Host "Done. You are on 'develop'. Next:" -ForegroundColor Green
Write-Host "  git switch -c chore/1-scaffold-vite-react-ts"
Write-Host "  claude"
