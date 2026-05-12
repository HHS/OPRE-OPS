---
name: create-pr
description: "Create a GitHub pull request with the project's PR template fully populated. Analyzes the branch diff, fills in What changed, Issue, How to test, A11y impact, Definition of Done, and other sections. Use this skill whenever the user wants to create a PR, open a pull request, submit their branch for review, or says things like 'make a PR', 'open a PR', 'submit this for review', or 'I'm ready to create a pull request' — even if they don't use the exact phrase 'pull request'."
argument-hint: "[base-branch]"
allowed-tools: Read, Grep, Glob, Bash
---

# Create Pull Request

Create a GitHub pull request using `gh pr create`, populating every section of the project's PR template at `.github/pull_request_template.md`. See [PR_TEMPLATE_GUIDE.md](PR_TEMPLATE_GUIDE.md) for detailed per-section filling rules.

## Gathering Context

Run these commands to understand ALL commits since the branch diverged from the base:

```bash
BASE="${ARGUMENTS:-main}"
git log "$BASE"..HEAD --oneline
git diff "$BASE"..HEAD --stat
git diff "$BASE"..HEAD
gh pr list --state merged --limit 5 --json title,body
```

## Filling In the Template

For each section, follow the guidance in [PR_TEMPLATE_GUIDE.md](PR_TEMPLATE_GUIDE.md):

- **What changed**: High-level summary + per-area breakdown (what and why, not line-by-line)
- **Issue**: Extract `OPS-NNNN` from branch name → link. Ask user if missing.
- **How to test**: Concrete steps + commands for test verification and manual UI checks
- **A11y impact**: Check "No accessibility-impacting changes" for backend-only PRs; leave unchecked for frontend changes
- **Definition of Done**: Check items the diff supports; leave unverifiable items for the author
- **Screenshots**: "N/A" for backend-only; placeholder for frontend changes
- **Links**: Related PRs/docs from commits, or "N/A"

## Creating the PR

1. Extract a short PR title (under 70 characters), conventional commit style preferred.
2. Push if needed: `git push -u origin HEAD`.
3. Show the user the title and body summary. Ask "Ready to create?" before proceeding.

```bash
gh pr create --title "the pr title" --body "$(cat <<'EOF'
## What changed
...

## Issue
...

## How to test
...

## A11y impact
...

## Screenshots
...

## Definition of Done Checklist
...

## Links
...
EOF
)"
```

After creating the PR, display the PR URL to the user.
