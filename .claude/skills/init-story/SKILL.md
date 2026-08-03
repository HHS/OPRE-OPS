---
name: init-story
description: Collect context from the developer and create a story markdown file in .claude/stories/ for the current branch. Use when the user says "init story", "create story", "start story", or "new story".
allowed-tools: Bash, Read, Write, Agent
---

# Init Story

Create a story file for the current branch by pulling context from GitHub and asking the developer targeted questions. The file will be used by `/update-story` to track AC progress throughout development.

## Step 1 — Detect the issue number and ensure a branch exists

Check the current branch:

```bash
git rev-parse --abbrev-ref HEAD
```

**If on `main` or any branch without an `OPS-NNNN` pattern:**

Ask the developer: "What is the GitHub issue number for this story?" Then ask: "What should the branch be called? (e.g. `OPS-NNNN/short-description`)"

Once you have both answers, create and check out the branch:

```bash
git checkout -b <BRANCH-NAME>
```

If the branch already exists remotely, check it out and pull instead. If the working tree has uncommitted changes, warn the developer before switching branches.

**If already on an `OPS-NNNN/description` branch:**

Extract the issue number from the branch name — the digits after `OPS-`. No need to ask.

## Step 2 — Pull context from GitHub

Fetch the issue to pre-populate the story — don't ask the developer to re-type what's already there:

```bash
gh issue view <NUMBER> --json title,body,labels -q '{title: .title, body: .body}'
```

If this command fails for any reason (not authenticated, issue not found, no network), tell the developer what failed and ask them to provide the issue title, acceptance criteria, and any relevant background manually before continuing.

Extract from the issue body:
- **User story** (look for "As a..." or "User Story" section)
- **Acceptance criteria** (look for checkboxes `- [ ]`, numbered lists, or bullet points describing requirements)
- **Background / current state / desired state** if present

If AC items are present but not formatted as `- [ ]` checkboxes, convert them to that format — this is required for `/update-story` to track progress. If AC items are genuinely absent from the issue, add a question in Step 3 to collect them from the developer before proceeding.

If other sections are sparse or missing, note what's missing — you'll fill gaps with developer input in Step 3.

## Step 3 — Ask targeted questions

Ask only what GitHub doesn't already tell you. Keep questions focused and concrete. Do not ask all at once — ask, wait for the answer, then ask the next.

Ask these in order:

1. **Technical approach**: "What's the high-level approach? Which existing pattern or component are you following?" (1-2 sentences is enough) — skip only if the issue has a detailed technical implementation plan.

2. **Key files** (always ask — never skip): "Which files will you primarily be touching?" This is required for `/update-story` to evaluate commits against AC items.

3. **Testing plan**: "What's your testing plan? For example: unit tests for helpers, Vitest+RTL for component rendering, no E2E needed." This will be validated against the project's testing philosophy.

4. **Known constraints or gotchas**: "Any known constraints, edge cases, or things to avoid?" — skip if the issue already documents these clearly.

Do not ask about: the title, AC items, user story, background — those come from the issue.

## Step 4 — Validate the plan with parallel agents

Before composing the story file, spawn three agents in parallel to pressure-test the plan against the codebase. Pass each agent the developer's answers from Step 3 as explicit input.

- **Agent 1 — Feasibility check**: You have access to the codebase at `/Users/josbell/Dev/OPRE-OPS`. Use Read and Grep to inspect the key files listed by the developer and the patterns they reference. Given the stated approach and file list: Does the plan align with how those files and patterns actually work? Are there wrong assumptions, missing files, or adjacent files that should be on the list? Report only concrete findings grounded in what you actually read — not generic advice.

- **Agent 2 — AC coverage check**: You have access to the codebase at `/Users/josbell/Dev/OPRE-OPS`. Use Read and Grep to inspect the key files. For each AC item, is there a plausible implementation path given the stated approach and files? Flag any AC items that seem underspecified, technically ambiguous, or likely to require files/systems not mentioned. Report only concrete findings grounded in what you actually read.

- **Agent 3 — Testing strategy check**: You have access to the codebase at `/Users/josbell/Dev/OPRE-OPS`. Read `docs/TESTING.md` first. Then, given the developer's testing plan and the AC items, evaluate against the project's testing philosophy:
  - Are tests at the lowest appropriate level (unit → integration → component → E2E)?
  - Is any E2E coverage justified, or could integration/component tests suffice?
  - Are the right frameworks being used (Vest for validation, Vitest+RTL for frontend unit, MSW for API mocking, Cypress CT for complex UI, Cypress E2E for critical full-stack journeys only)?
  - Flag tests for trivial code, framework internals, or implementation details that shouldn't be tested.
  - Flag AC items with no testing path identified.

A finding is **significant** if:
- Agent 1: a listed file doesn't exist, uses a different pattern than described, or important files are missing from the list
- Agent 2: any AC item lacks a clear implementation path
- Agent 3: any AC item has no testing path, or tests are proposed at the wrong level

Synthesize significant findings and surface them to the developer before proceeding. Ask for clarification on anything flagged. If no agent produces a significant finding, proceed directly to Step 5.

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

<checkboxes in `- [ ]` format — copied from the GitHub issue or converted from developer input>

## Technical Details

### Approach

<Developer's answer from Step 3 question 1>

### Key Files

<Developer's answer from Step 3 question 2 — as a bullet list>

### Testing Strategy

<Developer's testing plan from Step 3 question 3, refined by Agent 3's synthesis>

### Constraints

<Developer's answer from Step 3 question 4, or "None noted" if skipped>
```

Rules:
- Copy AC checkboxes verbatim from the GitHub issue — do not rephrase or reorder
- All boxes start unchecked `[ ]` regardless of issue state
- Keep the file short — only sections that help `/update-story` evaluate commits

## Step 6 — Confirm and write

Show the developer a preview of the generated file and ask: "Does this look right? I'll write it to `.claude/stories/<slug>.md`."

Name the file: `<issue-number>-<short-slug-from-title>.md` — e.g. `6032-story-tracking-automation.md`. Use lowercase, hyphens, max 5 words in the slug.

Once confirmed, write the file. Create `.claude/stories/` if it doesn't exist.

## Step 7 — Report back

Tell the developer:
- The file path written
- How many AC items were found
- That they can run `/update-story` at any point to mark progress and sync to GitHub
