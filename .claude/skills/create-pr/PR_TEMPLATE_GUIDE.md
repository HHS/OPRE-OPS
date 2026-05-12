# PR Template Section Guide

Detailed rules for populating each section of `.github/pull_request_template.md`.

## What changed

Write a concise high-level summary, then break down by file or area using bold directory/file names as headers. Focus on *what* changed and *why*.

## Issue

The project convention is `OPS-NNNN/description` in branch names. Format as:

```
https://github.com/HHS/OPRE-OPS/issues/<number>
```

If the branch name has no ticket number, ask the user.

## How to test

Include specific commands with paths for running relevant tests. For UI changes, add manual verification steps.

## A11y impact

Check whether the diff touches files under `frontend/src/`:
- **Backend-only**: check `[x] No accessibility-impacting changes in this PR`
- **Frontend changes**: leave checkboxes unchecked for the user

## Definition of Done Checklist

| Condition | Check |
|-----------|-------|
| PR includes test changes | "Automated unit tests updated and passed" and/or "Automated integration tests updated and passed" |
| Refactoring changes present | "OESA: Code refactored for clarity" |
| Coverage, load, security tests | Leave unchecked — author confirms |
| Backend-only PR | "Form validations updated" — leave unchecked |

## Screenshots

- Backend-only or no visual changes: "N/A — backend changes only"
- Frontend changes: note that screenshots should be added; leave a placeholder

## Links

Include links to related PRs, documentation, or design docs if evident from commit messages. Otherwise "N/A".
