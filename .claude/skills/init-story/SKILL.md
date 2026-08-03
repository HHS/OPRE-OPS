---
name: init-story
description: Collect context from the developer and create a story markdown file in .claude/stories/ for the current branch. Use when the user says "init story", "create story", "start story", or "new story".
allowed-tools: Bash, Read, Write, Agent
---

# Init Story

Create a story file for the current branch by pulling context from GitHub and asking the developer targeted questions. The file will be used by `/update-story` to track AC progress throughout development.

## Step 1 — Detect the issue number

Extract the issue number from the current branch name:

```bash
git rev-parse --abbrev-ref HEAD
```

Branch convention is `OPS-NNNN/description` — the issue number is the digits after `OPS-`.

If the branch name has no `OPS-NNNN` pattern, ask the developer: "What is the GitHub issue number for this work?"

## Step 2 — Pull context from GitHub

Fetch the issue to pre-populate the story — don't ask the developer to re-type what's already there:

```bash
gh issue view <NUMBER> --json title,body,labels -q '{title: .title, body: .body}'
```

Extract from the issue body:
- **User story** (look for "As a..." or "User Story" section)
- **Acceptance criteria** (look for checkboxes `- [ ]`)
- **Background / current state / desired state** if present

If the issue body is sparse or missing these sections, note what's missing — you'll fill gaps with developer input in Step 3.

## Step 3 — Ask targeted questions

Ask only what GitHub doesn't already tell you. Keep questions focused and concrete. Do not ask all at once — ask, wait for the answer, then ask the next.

Ask these in order, skipping any that are clearly answered by the issue:

1. **Technical approach**: "What's the high-level approach? Which existing pattern or component are you following?" (1-2 sentences is enough)

2. **Key files**: "Which files will you primarily be touching?" (A short list — helps `/update-story` evaluate commits against AC)

3. **Known constraints or gotchas**: "Any known constraints, edge cases, or things to avoid?" (Skip if the issue already documents these)

Do not ask about: the title, AC items, user story, background — those come from the issue.

## Step 4 — Validate the plan with parallel agents

Before composing the story file, spawn three agents in parallel to pressure-test the plan against the codebase:

- **Agent 1 — Feasibility check**: Given the approach and key files the developer described, does the plan align with how those files and patterns actually work in the codebase? Are there any gaps, wrong assumptions, or missing files that should be on the list?

- **Agent 2 — AC coverage check**: For each AC item, is there a plausible implementation path given the stated approach and files? Flag any AC items that seem underspecified, technically ambiguous, or likely to require files/systems not mentioned.

- **Agent 3 — Testing strategy check**: Read `docs/TESTING.md`. For each AC item and the described approach, evaluate the testing strategy against the project's testing philosophy:
  - Are tests proposed at the lowest appropriate level (unit → integration → component → E2E)?
  - Is any E2E coverage justified, or could it be covered by integration/component tests instead?
  - Are the right frameworks being used (Vest for validation, Vitest+RTL for frontend unit, MSW for API mocking, Cypress CT for complex UI components, Cypress E2E for critical full-stack journeys)?
  - Are any tests being proposed for trivial code, framework internals, or implementation details that should not be tested?
  - Flag gaps where AC items have no testing path identified.

Synthesize the findings from all three agents and surface any issues to the developer before proceeding. Ask for clarification on anything flagged before writing the file. If all agents find nothing significant, proceed directly to Step 5.

## Step 5 — Generate the story file

Compose the story file using the information gathered. Use this structure:

```markdown
---
issue: <NUMBER>
branch: <BRANCH-NAME>
---

# <ISSUE TITLE>

## Goal

<1-2 sentence summary of what this story accomplishes and why>

## Acceptance Criteria

<checkboxes copied exactly from the GitHub issue — preserve wording and order>

## Technical Details

### Approach

<Developer's answer from Step 3 question 1>

### Key Files

<Developer's answer from Step 3 question 2 — as a bullet list>

### Constraints

<Developer's answer from Step 3 question 3, or "None noted" if skipped>
```

Rules:
- Copy AC checkboxes verbatim from the GitHub issue — do not rephrase or reorder
- All boxes start unchecked `[ ]` regardless of issue state
- Keep the file short — only sections that help `/update-story` evaluate commits

## Step 6 — Confirm and write

Show the developer a preview of the generated file and ask: "Does this look right? I'll write it to `.claude/stories/<slug>.md`."

Name the file: `<issue-number>-<short-slug-from-title>.md` — e.g. `6032-story-tracking-automation.md`. Use lowercase, hyphens, max 5 words in the slug.

Once confirmed, write the file.

## Step 7 — Report back

Tell the developer:
- The file path written
- How many AC items were found
- That they can run `/update-story` at any point to mark progress and sync to GitHub
