---
name: create-pr
description: Create a GitHub pull request with the project's PR template fully populated. Analyzes the branch diff, fills in "What changed", "Issue", "How to test", "A11y impact", "Definition of Done", and other sections. Use this skill whenever the user wants to create a PR, open a pull request, submit their branch for review, or says things like "make a PR", "open a PR", "submit this for review", or "I'm ready to create a pull request" — even if they don't use the exact phrase "pull request".
argument-hint: "[base-branch]"
allowed-tools: Read, Grep, Glob, Bash(git log:*), Bash(git diff:*), Bash(git status:*), Bash(gh pr list:*), Bash(gh --version), Bash(bun run --cwd frontend a11y:validate-suppressions)
---

# Create Pull Request

Create a GitHub pull request using `gh pr create`, populating every section of the project's PR template at `.github/pull_request_template.md`.

## Gathering Context

Before writing the PR body, collect information about what changed on this branch — not just the latest commit, but ALL commits since the branch diverged from the base.

The base branch is `$ARGUMENTS` if one was given, otherwise `main`. Write it literally into each command below (shown as `main`); each Bash call is a fresh shell, so a shell variable set in one won't exist in the next.

```bash
# All commits on this branch
git log main..HEAD --oneline

# Files changed with stats (three dots: diff from where the branch forked, like the PR will show)
git diff main...HEAD --stat

# Full diff for reading the actual changes
git diff main...HEAD

# Recent merged PRs for style reference
gh pr list --state merged --limit 5 --json title,body
```

Then read `.github/pull_request_template.md` with the Read tool — it's the body skeleton.

Read the full diff carefully. You need to understand every change to write an accurate PR description.

## Filling In the Template

Build the body from the template you just read, not from memory — the template is the source of truth and changes over time:

- Keep every `##` section, in the template's order. Replace each italic `_placeholder_` with real content (the sections below say what to write when there's nothing to add).
- Keep every checkbox line as written, checking (`[x]`) only the ones that apply. Don't delete unchecked options — reviewers read them as "considered, not applicable".
- Drop the "**Web UI contributors:**" blockquote under "What changed"; it's guidance for people editing on github.com, not PR content.
- If the template has a section this skill doesn't cover below, fill it from the diff anyway — never drop a section.

### What changed

Write a concise summary of what the PR does at a high level — the kind of thing a reviewer reads to orient themselves before looking at code. Follow with a breakdown by file or area, using bold filenames or directory names as headers. Focus on *what* changed and *why*, not line-by-line narration.

### Decisions reviewers may ask about (optional)

Add this section, right after "What changed", **only when the PR makes choices a reviewer — human or agent — could reasonably question**. Skip it for straightforward PRs; an empty or padded section is worse than none.

Good candidates:

- An approach chosen over a plausible alternative (and why the alternative lost).
- Something deliberately left alone, or deliberately not tested, that a reviewer might flag as a gap.
- A non-obvious technical constraint that explains odd-looking code (e.g. a migration quirk).
- A deviation from a convention or from what the ticket literally says.
- A rollout or deploy-ordering risk, or an irreversible step.
- Out-of-scope follow-ups you noticed but did not do.

Format: one bullet per decision, the likely question in bold, then the answer with the reason. Keep each to one or two sentences, and don't restate the diff — every bullet should be something that could draw a review comment. Check each claim against the code before writing it down; a wrong rationale in the PR is worse than none.

This is a public repo: don't name real users, user IDs, or production infrastructure resources in this section.

### Issue

Extract the ticket number from the branch name (the project convention is `OPS-NNNN/description`). Format it as a full link:

```
[OPS-NNNN](https://github.com/HHS/OPRE-OPS/issues/NNNN)
```

If the branch name doesn't contain a ticket number, ask the user.

Never write `Closes`, `Fixes` or `Resolves` before the issue. GitHub would close the issue on merge and skip the team's review and QA steps. Anywhere in the body, don't write a bare `#N` either: GitHub turns it into a link to whatever issue has that number. Use the full link, or write it out in words ("agreement ID 14").

### How to test

Write concrete, actionable steps a reviewer can follow to verify the change works. Include specific commands (with paths) for running relevant tests. If the change affects the UI, include steps for manual verification too. Think about what a reviewer unfamiliar with this part of the codebase would need.

### A11y impact

Check whether the diff touches any frontend files (anything under `frontend/src/`). If it does, leave the first two checkboxes unchecked for the user to decide. If the PR is backend-only or has no UI changes, check the "No accessibility-impacting changes" box:

```
- [x] No accessibility-impacting changes in this PR
```

For the `A11Y-SUPPRESSION` box, check whether the PR adds or changes a suppression comment:

```bash
git diff main...HEAD -G 'A11Y-SUPPRESSION' --name-only -- frontend/cypress
```

If that lists no files, leave the box unchecked. If it lists files, run the same validator CI runs, rather than checking the fields by eye:

```bash
bun run --cwd frontend a11y:validate-suppressions
```

Check the box only if it passes. If it fails, show the user its output instead of checking the box.

### Storybook

Stories live beside their component as `*.stories.jsx`. Check the diff:

- No component files changed, or the change is page-level or non-visual → check "No UI component changes" or "N/A — change is page-specific or non-visual", whichever is more accurate.
- A new component under `frontend/src/components/UI/` with a new `.stories.jsx` → check "Story added for new component".
- A component's props or states changed and its `.stories.jsx` was updated in the diff → check "Story updated to reflect changed props/states".
- A new `UI/` component with no story, or changed props with a story that wasn't updated → leave the boxes unchecked and point out the gap to the user before creating the PR.

### Definition of Done Checklist

Analyze the diff to determine which checklist items are relevant:

- If the PR includes test changes: check "Automated unit tests updated and passed" and/or "Automated integration tests updated and passed"
- If there are refactoring changes: check "OESA: Code refactored for clarity"
- Leave items unchecked when you can't verify them (coverage numbers, load tests, security tests, etc.) — the author will confirm these
- For backend-only PRs, "Form validations updated" is typically not applicable — leave unchecked

### Screenshots

If the PR is backend-only or has no visual changes, replace the template's placeholder with "N/A — backend changes only" or similar.

If there are visual changes, attach screenshots with `gh pr create --attach` (needs gh 2.99.0+; check with `gh --version`):

- Only attach screenshots taken in this session of this branch's changes, such as the files a `/visual-check` run in this session reported (it saves to a fresh `/tmp/playwright-mcp/visual-check.XXXX/` directory). Never pick files by browsing or globbing `/tmp/playwright-mcp/` — it's shared by every Playwright session and can hold old captures from other environments.
- Reference each image in the body with its **absolute path**, and pass the exact same path to `--attach`. gh rewrites matching references to the uploaded `github.com/user-attachments` URL; an attached file with no matching reference is appended to the end of the body instead.
- Keep screenshots outside the repo. **Never commit screenshots** (no `.github/pr-assets/` or similar) — they stay in `main`'s history forever.
- If there are no screenshots from this session, replace the template's placeholder with "Screenshots to follow". The author can add them later with `gh pr edit <number> --attach <file>` (appended to the end of the body) or by dragging them into the PR on github.com.
- If gh is older than 2.99.0 or the upload fails, stop and tell the user rather than working around it.

### Links

Include links to related PRs, documentation, or design docs if they appear in commit messages or are otherwise evident. Otherwise write "N/A".

## Creating the PR

Extract a short, descriptive PR title (under 70 characters) from the changes. Use conventional commit style if it fits naturally (e.g., "feat(procurement): add tracker creation during spreadsheet ingest").

Before creating the PR:
1. Confirm with the user: show them the title, a summary of what the PR body will contain, whether the branch still needs pushing, and **the full path of every file you'll `--attach`** (these become publicly visible). Ask "Ready to create?" and wait for a yes. Nothing leaves the machine before this.
2. Only after they confirm: if the branch isn't on the remote yet, push it with `git push -u origin HEAD`, then run `gh pr create`. These two commands aren't pre-approved for this skill, so Claude Code will also ask for permission before running them.

If there's no user to confirm with (e.g. running as a subagent or headless), don't push or create the PR. Return the title, body and attachment paths for the caller to review instead.

Use a HEREDOC for the body to preserve formatting, with one `--attach` per screenshot (none when there are no screenshots). The body is the filled-in template from above; if you're including the optional decisions section, it goes between `What changed` and `Issue`:

```bash
gh pr create --title "the pr title" \
  --attach /absolute/path/from/this/session/screenshot.png \
  --body "$(cat <<'EOF'
<the filled-in .github/pull_request_template.md, with each screenshot referenced as
![alt text](/absolute/path/from/this/session/screenshot.png) in its Screenshots section>
EOF
)"
```

After creating the PR, display the PR URL to the user.
