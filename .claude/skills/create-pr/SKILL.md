---
name: create-pr
description: Create a GitHub pull request with the project's PR template fully populated. Analyzes the branch diff, fills in "What changed", "Issue", "How to test", "A11y impact", "Definition of Done", and other sections. Use this skill whenever the user wants to create a PR, open a pull request, submit their branch for review, or says things like "make a PR", "open a PR", "submit this for review", or "I'm ready to create a pull request" — even if they don't use the exact phrase "pull request".
argument-hint: "[base-branch]"
allowed-tools: Read, Grep, Glob, Bash
disable-model-invocation: true
---

# Create Pull Request

Create a GitHub pull request using `gh pr create`, populating every section of the project's PR template at `.github/pull_request_template.md`.

## Gathering Context

Before writing the PR body, collect information about what changed on this branch. Run these commands to understand the full scope of the PR — not just the latest commit, but ALL commits since the branch diverged from the base.

```bash
# Determine base branch (default: main, or use $ARGUMENTS if provided)
BASE="${ARGUMENTS:-main}"

# All commits on this branch
git log "$BASE"..HEAD --oneline

# Files changed with stats
git diff "$BASE"..HEAD --stat

# Full diff for reading the actual changes
git diff "$BASE"..HEAD

# Recent merged PRs for style reference
gh pr list --state merged --limit 5 --json title,body
```

Read the full diff carefully. You need to understand every change to write an accurate PR description.

## Filling In the Template

### What changed

Write a concise summary of what the PR does at a high level — the kind of thing a reviewer reads to orient themselves before looking at code. Follow with a breakdown by file or area, using bold filenames or directory names as headers. Focus on *what* changed and *why*, not line-by-line narration.

### Issue

Extract the ticket number from the branch name (the project convention is `OPS-NNNN/description`). Format it as a link:

```
https://github.com/HHS/OPRE-OPS/issues/<number> (or reference the Jira/ticket tracker the team uses)
```

If the branch name doesn't contain a ticket number, ask the user.

### How to test

Write concrete, actionable steps a reviewer can follow to verify the change works. Include specific commands (with paths) for running relevant tests. If the change affects the UI, include steps for manual verification too. Think about what a reviewer unfamiliar with this part of the codebase would need.

### A11y impact

Check whether the diff touches any frontend files (anything under `frontend/src/`). If it does, leave the checkboxes unchecked for the user to decide. If the PR is backend-only or has no UI changes, check the "No accessibility-impacting changes" box:

```
- [x] No accessibility-impacting changes in this PR
```

### Definition of Done Checklist

Analyze the diff to determine which checklist items are relevant:

- If the PR includes test changes: check "Automated unit tests updated and passed" and/or "Automated integration tests updated and passed"
- If there are refactoring changes: check "OESA: Code refactored for clarity"
- Leave items unchecked when you can't verify them (coverage numbers, load tests, security tests, etc.) — the author will confirm these
- For backend-only PRs, "Form validations updated" is typically not applicable — leave unchecked

### Screenshots

If the PR is backend-only or has no visual changes, write "N/A — backend changes only" or similar. If there are frontend changes, note that screenshots should be added and leave a placeholder.

### Links

Include links to related PRs, documentation, or design docs if they appear in commit messages or are otherwise evident. Otherwise write "N/A".

## Creating the PR

Extract a short, descriptive PR title (under 70 characters) from the changes. Use conventional commit style if it fits naturally (e.g., "feat(procurement): add tracker creation during spreadsheet ingest").

Before creating the PR:
1. Check if the branch has been pushed to the remote. If not, push it with `git push -u origin HEAD`.
2. Confirm with the user: show them the title and a summary of what the PR body will contain. Ask "Ready to create?" before running `gh pr create`.

Use a HEREDOC for the body to preserve formatting:

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
