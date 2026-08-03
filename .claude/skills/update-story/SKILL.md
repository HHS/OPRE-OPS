---
name: update-story
description: Update the current story's acceptance criteria checkboxes based on recent git history, then sync the updated body back to the linked GitHub issue. Use when the user says "update story", "mark AC done", "sync story", or "update the issue".
allowed-tools: Read, Write, Bash, Skill
---

# Update Story

Sync the current branch's story markdown file with what has actually been completed, then push the updated AC back to the linked GitHub issue.

## Step 1 — Identify the story file

Extract the issue number from the current branch name:

```bash
git rev-parse --abbrev-ref HEAD
```

Branch naming convention is `OPS-NNNN/description` — the issue number is the digits after `OPS-`.

If the branch name has no `OPS-NNNN` pattern, ask the developer: "I couldn't detect an issue number from the branch name. What is the GitHub issue number for this work?"

Look for a story file in `.claude/stories/` whose frontmatter contains a matching `issue:` field:

```bash
grep -rl "issue: <NUMBER>" .claude/stories/
```

If multiple files match, list them and ask the developer which one to update.

If no file matches, list all story files and ask the user which one applies:

```bash
ls .claude/stories/
```

If `.claude/stories/` is empty or doesn't exist, ask: "No story file found for this branch. Would you like to create one now?" If yes, invoke the `/init-story` skill and stop — `/update-story` will be runnable once the story file exists.

Read the story file in full before proceeding.

## Step 2 — Gather what has been done

Collect all commits on this branch since it diverged from main:

```bash
git log main..HEAD --oneline
```

Read the full diff to understand what was actually implemented — not just filenames:

```bash
git diff main..HEAD
```

For large diffs, use `git log -p main..HEAD` to get the full patch per commit.

## Step 3 — Update the AC checkboxes

Compare the commits and full diff against each **unchecked** AC item in the story file.

Rules:
- **Never uncheck an item already marked `[x]`** — only evaluate currently unchecked items
- Mark an item `[x]` only when you are confident the work is clearly reflected in the code diff — not speculatively based on commit messages alone
- Leave items unchecked if the diff doesn't clearly cover them, they are UX/manual validation items, or they require human confirmation (deploys, accessibility review, etc.)

Edit the story file to update the checkboxes. Do not change any other content.

## Step 4 — Sync to GitHub

Fetch the current issue body from GitHub:

```bash
gh issue view <NUMBER> --json body -q .body
```

If this command fails, tell the developer what failed, show them the updated story file content, and ask them to paste the updated AC section into the GitHub issue manually. Stop here.

Merge AC state carefully — do not treat the story file as the sole authority:
- For each AC item, take the checkbox as checked (`[x]`) if it is checked in **either** the story file **or** the current GitHub issue body. This prevents overwriting boxes a PM or reviewer checked directly on GitHub.
- Preserve all non-AC sections of the issue body exactly as fetched.

To find the AC section boundary in the issue body, look for a heading matching `Acceptance Criteria` (any markdown heading level or bold format). Replace only the content between that heading and the next heading (or end of section). If no recognizable AC section header exists, append the updated AC at the end of the issue body rather than replacing — and tell the developer so they can reformat manually if needed.

Write the updated body to a temp file and use `--body-file` to avoid shell quoting issues with special characters:

```bash
tmp=$(mktemp)
printf '%s' "<updated body>" > "$tmp"
gh issue edit <NUMBER> --body-file "$tmp"
rm "$tmp"
```

If this command fails, tell the developer what failed and show them the full updated body to paste manually.

## Step 5 — Report back

Tell the user:
- Which AC items were newly checked off
- Which items remain open and why
- Confirm the GitHub issue was updated with a link: `https://github.com/HHS/OPRE-OPS/issues/<NUMBER>`
- If any `gh` commands failed, clearly state that the GitHub sync did not complete and what to do next
