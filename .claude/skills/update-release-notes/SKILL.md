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
- "latest" / "what shipped recently" → last 14 days ending today
- "last sprint" / "last 2 weeks" → previous 14-day window
- A specific date → 14 days ending on that date
- A specific range → use the provided range as-is

```bash
# Example: last 2 weeks
START_DATE=$(date -d '14 days ago' +%Y-%m-%d)  # Linux
START_DATE=$(date -v-14d +%Y-%m-%d)            # macOS
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
gh project item-list 5 --owner HHS --format json
```

Filter results into two groups:
- **Shipping now** — Status equals **"Review / Demo"** and updated within the date range from Step 1. These feed the release notes draft (Step 4) and move to `"Done"` on the roadmap board (Step 8).
- **In progress** — Status equals **"In Progress"** (or your board's equivalent active-work column), regardless of date. These feed the `"Currently Developing"` column on the roadmap board (Step 8) — read regardless of whether you're updating release notes this time.

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

What to do, using the "shipping now" and "in progress" items you gathered in Step 3:
1. For each item that just shipped as a `"New Feature"` in the `data.js` entry you added in Step 7: find its matching item in `roadmapData.json` and move it from `"Currently Developing"` to `"Done"`. If it isn't already in the file, add it directly under `"Done"`.
2. Ask the user which item(s) from `"Not Started Yet"` should move to `"Currently Developing"` now that work has started on them — cross-check against the "In Progress" items from Step 3.
3. Keep titles short and user-facing (a few words), matching the Tone Guide's voice. This board is curated by the UX team, not a mechanical mirror of the full backlog — use judgment about what's worth surfacing, same as before.
4. Give each new item a unique integer `id` (continue the existing sequence; don't reuse an id still in use elsewhere in the file).

Example of a single entry:
```json
{ "id": 16, "title": "View Grant History", "status": "Done" }
```

Keep the array's existing 4-space indentation and formatting exactly — this file is also checked by this repo's `prettier` and `check json` pre-commit hooks (see the note on hooks in Step 9), so malformed JSON or inconsistent spacing will fail CI even though this looks like a simple data edit.

### 9. Create Branch, Commit, and PR

```bash
git checkout -b docs/updated-release-notes-sprint-{number} main
git add frontend/src/pages/home/release-notes/data.js frontend/src/pages/home/roadmapData.json
git commit -m "docs: updated release notes sprint {number}"
git push origin docs/updated-release-notes-sprint-{number}
```

Let the pre-commit hooks run normally — don't reach for `--no-verify` by default. `roadmapData.json` is plain JSON and gets checked by this repo's `check json` and `prettier` hooks specifically to catch exactly the kind of mistake a quick manual edit can introduce (malformed JSON, inconsistent indentation). If a hook fails:
- `prettier`/`check json` failing almost always means the JSON needs a formatting fix — run `cd frontend && bun run format` and re-commit, don't skip the hook.
- Only use `--no-verify` if an unrelated hook (e.g. a flaky secret scanner) is blocking an otherwise-correct commit, and say so when you do.

If `gh` CLI is authenticated, create the PR directly:
```bash
gh pr create --title "docs: updated release notes sprint {number}" --body "Updated release notes for sprint {number}"
```

Otherwise, guide the user to create the PR on GitHub:
1. Go to github.com/HHS/OPRE-OPS
2. Click "Compare & pull request"
3. Title: `docs: updated release notes sprint {number}`
4. Create pull request

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
- This skill requires `gh` CLI to be installed and authenticated
- If `gh` auth fails, guide the user through `gh auth login`
- The user is a UX Designer — keep instructions simple and non-technical
- IDs restart at `"0001"` within each release object in `data.js`; `roadmapData.json`'s `id`s are a single flat sequence across the whole file, not per-status
- **Never add `Closes #NNN` or `Fixes #NNN`** to PR descriptions — the team's process requires additional review steps before closing stories
