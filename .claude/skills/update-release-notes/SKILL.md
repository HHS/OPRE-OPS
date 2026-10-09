---
name: "update-release-notes"
description: "Generate and commit user-facing release notes by querying the GitHub Project board, updating the OPS release notes file, and keeping the homepage roadmap board in sync."
---

# Update Release Notes

Generate user-facing release notes from the live GitHub Project board and commit them to the OPS data files via a PR.

## How to Use

Trigger phrases:
- "Update the release notes"
- "What shipped recently?"
- "Generate release notes"
- "Add new release notes"
- "Create a release notes PR"
- "What's new?"
- "Update the roadmap"

## Tone Guide

**Apply this tone to ALL release notes output** — both the review draft and the final `data.js` entries. Keep item titles in `roadmapData.json` short and user-facing in the same voice (a few words, not a sentence).

- **Second person** — "You can now...", "Now you can..."
- **"We" for the team's work** — "We added...", "We fixed...", "We improved..."
- **Conversational and friendly** — "so you can easily see...", "so it's easier to find..."
- **Explain the "why"** — not just what changed, but why it matters to the user
- **Plain language** — no technical jargon, no PR numbers, no code terms
- **Reference OPS features by name** — "procurement tracker", "budget lines", "agreements list"
- **Past tense for fixes** — "We fixed a bug...", "We discovered a bug..."
- **Present tense for new features** — "You can now...", "Each CAN now includes..."
- **Reference user feedback when relevant** — "Based on your feedback..."
- **1–2 sentences per change**, occasionally 3 for complex features
- **No emoji** in the `data.js` content

### Tone Examples

> "You can now create grants in OPS! This includes adding grant-specific details such as the NOFO number, budget periods, ALN numbers and grant numbers."

> "We fixed a bug related to the default sort order in the agreements list. It now sorts the agreement name alphabetically by default."

> "Based on your feedback, the agreements list page now includes new columns such as Start, End, Total and FY25 Obligated..."

## Steps

### 1. Determine the Date Range

Default to the **last 2 weeks** from today. Allow overrides:
- "latest" / "what shipped recently" / "last sprint" / "last 2 weeks" → all mean the same thing: last 14 days ending today
- A specific date → 14 days ending on that date
- A specific range → use the provided range as-is

```bash
# Example: last 2 weeks — guarded by platform, since macOS's `date -v` and Linux's
# `date -d` aren't interchangeable (running the wrong one silently produces an empty
# START_DATE instead of erroring loudly).
if [[ "$(uname)" == "Darwin" ]]; then
    START_DATE=$(date -v-14d +%Y-%m-%d)
else
    START_DATE=$(date -d '14 days ago' +%Y-%m-%d)
fi
END_DATE=$(date +%Y-%m-%d)
```

### 2. Verify Repository Context

```bash
git remote -v
```

Confirm you're in the OPRE-OPS repository before proceeding.

### 3. Query the Live GitHub Project Board

Fetch items from the [ACF OPRE-OPS project](https://github.com/orgs/HHS/projects/5):

```bash
gh project item-list 5 --owner HHS --format json -L 200
```

`gh project item-list` defaults to 30 items, which can silently truncate a long-lived board. Pass a generous `-L` and compare the returned item count against the JSON's `totalCount` field; if they don't match, re-run with a higher `-L` rather than proceeding on an incomplete list.

Filter results into two groups:
- **Shipping now** — Status equals **"Review / Demo"**. These feed the release notes draft (Step 4) and move to `"Done"` on the roadmap board (Step 8).
- **In progress** — Status equals **"In Progress"** (or your board's equivalent active-work column). These feed the `"Currently Developing"` column on the roadmap board (Step 8) — read regardless of whether you're updating release notes this time.

The date range from Step 1 is meant to narrow "Shipping now" to recent work, but `gh project item-list`'s JSON doesn't reliably include the project item's own `updatedAt` — only the linked issue/PR (under `content`) has timestamps, and even that may be absent depending on the field's shape. **Don't guess or silently skip the date filter.** For each "Review / Demo" item, check `content.updatedAt` (or run `gh issue view <number>` / `gh pr view <number>` on its linked content if that's missing) to decide whether it falls in range. If an item's timestamp truly can't be determined, say so and ask the user whether to include it rather than assuming either way.

For each item, read its details (title, description, labels, linked PRs) to understand the change.

### 4. Filter and Categorize

**Only include items a user would notice.** Ask: *"Would a user see or experience this change?"*

Include:
- ✅ New pages, features, or workflows
- ✅ Bug fixes the user would have encountered
- ✅ New filters, exports, or actions
- ✅ Meaningful behavior changes

Skip:
- ❌ Display/layout tweaks (spacing, alignment, column width)
- ❌ Internal validation changes (unless they change what the user can or can't do)
- ❌ Refactors with no visible user impact
- ❌ Dependency updates
- ❌ Test, docs, or CI changes
- ❌ Accessibility fixes (unless major)
- ❌ Performance improvements (unless noticeably faster)

Categorize each included item as one of:
- `"New Feature"` — something that didn't exist before
- `"Improvements"` — an enhancement to something that already existed
- `"Fixes"` — a bug fix the user would have noticed

**Group aggressively** — if multiple items relate to the same feature area, combine them into one entry.

### 5. Write the Release Notes Draft

Using the **Tone Guide** above, write a draft of the release notes and **present them to the user for review** before making any file changes.

Format the draft as a simple list grouped by type so the user can review and request edits.

### 6. Confirm Version, Date, and Sprint

Ask the user for:
- **Sprint number** — for the branch name and PR title
- **Version number** — e.g., 1.456.0 (no "v" prefix in the data file)
- **Release date** — format: YYYY-MM-DD

If not provided, look them up:
```bash
git tag --sort=-creatordate | head -1
git log --format="%ad %D" --date=short --tags --simplify-by-decoration | grep "tag:" | head -1
```

Confirm with the user before proceeding.

### 7. Update the Release Notes Data File

Read the current file at: `frontend/src/pages/home/release-notes/data.js`

Add the new release note object at the **TOP** of the `data` array (after `export const data = [`). The first entry shows as the "current" release; everything below goes into a collapsible accordion as past releases.

Format:
```javascript
{
    releaseDate: "YYYY-MM-DD",
    version: "X.Y.Z",
    changes: [
        {
            id: "0001",
            subject: "Feature name",
            type: "New Feature",  // or "Improvements" or "Fixes"
            description:
                "Plain language description of the change."
        }
    ]
}
```

Rules:
- Number change IDs sequentially starting at `"0001"` within each release
- All text values must be strings wrapped in double quotes
- Match the indentation style of the existing file (4 spaces)
- Multi-line descriptions use the existing pattern: `description:` on one line, then the string indented on the next

### 8. Update the Roadmap Status Board

Read `frontend/src/pages/home/roadmapData.json` — one flat array of `{id, title, status}` objects. `status` must be exactly one of these three plain strings (no JS enum to import — this is pure JSON):
- `"Done"`
- `"Currently Developing"`
- `"Not Started Yet"`

**This file feeds two homepage surfaces at once**: the "OPS Updates" summary card shown on every tab, and the full roadmap board on the "OPS at a Glance" tab. Editing it here keeps both in sync — this is exactly the kind of drift this file was introduced to prevent, so don't update `data.js` without also checking this file.

This step has two different kinds of decision in it — don't conflate them:
- **Updating an existing tracked item's status is mechanical, not a curation call.** If `roadmapData.json` is already tracking something as `"Currently Developing"` and it just shipped, it's done — regardless of whether `data.js` logged it as a `"New Feature"`, `"Improvements"`, or `"Fixes"` entry. A roadmap item that finishes via a late bugfix is exactly as done as one that finishes via a shiny new feature; leaving it stuck at "Currently Developing" because of how its last increment happened to be categorized recreates the exact drift this file exists to prevent.
- **Adding a brand-new item that wasn't already tracked is a curation call.** This board is a curated highlight reel, not a mechanical mirror of the full backlog (same as always) — most individual bug fixes shouldn't become their own new roadmap row. New entries are typically only worth adding for `"New Feature"`-level work.

What to do, using the "shipping now" and "in progress" items you gathered in Step 3:
1. For **every** item that just shipped in the `data.js` entry you added in Step 7 — regardless of its `"New Feature"` / `"Improvements"` / `"Fixes"` type — check whether it matches an existing `"Currently Developing"` item in `roadmapData.json` (by meaning, not just exact title string — e.g. "Add Procurement Tracker Award Step" shipping can complete an existing "Finish Procurement Tracker" entry). If it matches, move that existing item to `"Done"`.
2. Only **add** a new item directly under `"Done"` for shipped work that wasn't already tracked **and** is big enough to be worth surfacing on the roadmap — use the same curation judgment as always; don't add one for every routine fix.
3. Ask the user which item(s) from `"Not Started Yet"` should move to `"Currently Developing"` now that work has started on them — cross-check against the "In Progress" items from Step 3.
4. Keep titles short and user-facing (a few words), matching the Tone Guide's voice.
5. Give each new item a unique integer `id` (continue the existing sequence; don't reuse an id still in use elsewhere in the file).

Example of a single entry:
```json
{ "id": 16, "title": "View Grant History", "status": "Done" }
```

Keep the array's existing 4-space indentation and formatting exactly — this file is also checked by this repo's `prettier` and `check json` pre-commit hooks (see the note on hooks in Step 9), so malformed JSON or inconsistent spacing will fail CI even though this looks like a simple data edit.

### 9. Create Branch, Commit, and PR

Fetch first — a stale local `main` would cut the new branch from an outdated tree:

```bash
git fetch origin main
git checkout -b docs/updated-release-notes-sprint-{number} origin/main
```

Before committing, run this repo's mandated frontend pre-commit checks proactively (per the root `CLAUDE.md` Pre-Commit Workflow) rather than relying only on the hooks to catch problems reactively. Run it as a subshell — the parentheses matter: Claude Code's shell keeps its working directory between separate commands, so a bare `cd frontend && ...` would leave later repo-root-relative paths (like `git add frontend/...`) resolving incorrectly.

```bash
(cd frontend && bun run format && bun run lint --fix)
```

Then stage and commit, from the repo root:

```bash
git add frontend/src/pages/home/release-notes/data.js frontend/src/pages/home/roadmapData.json
git commit -m "docs: updated release notes sprint {number}"
git push origin docs/updated-release-notes-sprint-{number}
```

Don't reach for `--no-verify` by default. `roadmapData.json` is plain JSON and gets checked by this repo's `check json` and `prettier` hooks specifically to catch exactly the kind of mistake a quick manual edit can introduce (malformed JSON, inconsistent indentation). If a hook fails:
- `prettier`/`check json` failing almost always means the JSON needs a formatting fix — run `(cd frontend && bun run format)` **and then `git add` the reformatted files again, from the repo root** before re-committing. Re-running the commit without re-staging will just check the same stale, unformatted snapshot and fail again.
- Only use `--no-verify` if an unrelated hook (e.g. a flaky secret scanner) is blocking an otherwise-correct commit, and say so when you do.

Once the branch is pushed, **don't call `gh pr create` yourself** with just a title and short body — that skips the repo's PR template. This repo's `create-pr` skill populates the full `.github/pull_request_template.md` (What changed, Issue, How to test, A11y impact, Definition of Done, etc.) for exactly this, but it has `disable-model-invocation: true`, meaning you can't invoke it on your own — only the user can trigger it, by typing `/create-pr`. So instead, tell the user the branch is pushed and ask them to run `/create-pr` themselves to open it with the full template.

### 10. Offer to Preview

Let the user know they can preview locally:
```bash
docker compose up frontend --build
```
Then visit http://localhost:3000

Or wait for the staging deployment after merge.

## Important Notes

- The repository is **HHS/OPRE-OPS**
- The GitHub Project is **#5** under the **HHS** org
- The release notes data file is at `frontend/src/pages/home/release-notes/data.js`
- The roadmap/"Currently Developing" data file is at `frontend/src/pages/home/roadmapData.json` — plain JSON, shared by the homepage summary card and the "OPS at a Glance" tab. Update both files together so they can't drift apart again.
- This skill requires `gh` CLI to be installed and authenticated **with the `read:project` scope** — a user can be fully authenticated and still have Step 3 fail, since default `gh auth login` scopes don't always include project access. If `gh project item-list` errors about missing scopes, run `gh auth refresh -s read:project` (an interactive browser step) rather than re-running `gh auth login`, which won't fix a scope gap on an already-authenticated account.
- The user is a UX Designer — keep instructions simple and non-technical
- IDs restart at `"0001"` within each release object in `data.js`; `roadmapData.json`'s `id`s are a single flat sequence across the whole file, not per-status
- **Never add `Closes #NNN` or `Fixes #NNN`** to PR descriptions — the team's process requires additional review steps before closing stories
