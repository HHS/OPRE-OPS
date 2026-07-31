---
name: update-story
description: Update the current story's acceptance criteria checkboxes based on recent git history, then sync the updated body back to the linked GitHub issue. Use when the user says "update story", "mark AC done", "sync story", or "update the issue".
allowed-tools: Read, Bash
---

# Update Story

Sync the current branch's story markdown file with what has actually been completed, then push the updated AC back to the linked GitHub issue.

## Step 1 — Identify the story file

Extract the issue number from the current branch name:

```bash
git rev-parse --abbrev-ref HEAD
```

Branch naming convention is `OPS-NNNN/description` — the issue number is the digits after `OPS-`.

Look for a story file in `.claude/stories/` whose frontmatter contains a matching `issue:` field:

```bash
grep -rl "issue: <NUMBER>" .claude/stories/
```

If no file matches, list all story files and ask the user which one applies:

```bash
ls .claude/stories/
```

Read the story file in full before proceeding.

## Step 2 — Gather what has been done

Collect all commits on this branch since it diverged from main:

```bash
git log main..HEAD --oneline
```

Also read the full diff to understand what was actually implemented:

```bash
git diff main..HEAD --stat
```

## Step 3 — Update the AC checkboxes

Compare the commits and diff against each unchecked AC item in the story file. Mark an item `[x]` only when you are confident the work is reflected in the git history — not speculatively.

Leave items unchecked if:
- The commit history doesn't clearly cover them
- They are UX/manual validation items
- They are "Definition of Done" items that require human confirmation (deploys, accessibility review, etc.)

Edit the story file to update the checkboxes. Do not change any other content.

## Step 4 — Sync to GitHub

Fetch the current issue body from GitHub so you don't overwrite content added directly to the issue:

```bash
gh issue view <NUMBER> --json body -q .body
```

Replace the Acceptance Criteria section in the issue body with the updated checkboxes from the story file. Preserve all other sections of the issue body unchanged.

Update the issue:

```bash
gh issue edit <NUMBER> --body "$(cat <<'EOF'
<updated body>
EOF
)"
```

## Step 5 — Report back

Tell the user:
- Which AC items were newly checked off
- Which items remain open and why
- Confirm the GitHub issue was updated with a link: `https://github.com/HHS/OPRE-OPS/issues/<NUMBER>`
