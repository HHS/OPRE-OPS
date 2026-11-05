---
name: init-story
description: Collect context from the developer and create a story markdown file in .claude/stories/ for the current branch. Use when the user says "init story", "create story", "start story", or "new story".
argument-hint: "[issue-number]"
allowed-tools: Bash, Read, Write, Agent
disable-model-invocation: true
---

# Init Story

Create a story file for the current branch by pulling context from GitHub, asking the developer one round of mostly-optional input, and investigating the codebase to fill in the rest. The file will be used by `/update-story` to track AC progress throughout development.

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

If AC items are present but not formatted as `- [ ]` checkboxes, convert them to that format — this is required for `/update-story` to track progress. If AC items are genuinely absent from the issue, that's a hard blocker, not something to infer — but don't interrupt the developer a second time for it. Fold it into the single ask in Step 3 instead (see below) so it's still one round-trip, not two.

If other sections are sparse or missing, note what's missing — the investigation in Step 4 will try to fill the gaps; anything it can't will surface in Step 5.

## Step 3 — One optional ask

The developer's attention is the scarce resource here — ask once, then go figure out the rest yourself. Send a single message:

- If AC items are missing from the issue (flagged in Step 2), make that part of the ask required, not optional: "I couldn't find acceptance criteria in the issue — what are they?" — then continue in the same message with the optional part below.
- Always include the optional, open-ended part: "Anything else you want to tell me up front — approach, key files, testing plan, constraints/gotchas? Optional, answer as much or as little as you like. I'll investigate the codebase and figure out the rest."

Whatever they volunteer (all of it, some of it, or nothing beyond required AC) becomes input to Step 4 alongside the issue content. Do not ask the four optional topics as separate questions, and do not re-ask about anything already covered by the issue (title, AC items if present, user story, background).

## Step 4 — Investigate and infer with parallel agents

Before composing the story file, spawn three agents in parallel to work out everything the developer didn't hand you, and to pressure-test anything they did. Pass each agent the issue content and whatever the developer volunteered in Step 3 as explicit input. Each agent's job is to reach a confident answer by reading the codebase — not to ask questions itself. "Significant" below means the agent could not reach a confident answer even after investigating, not merely that the developer left something unstated.

- **Agent 1 — Approach & key files**: If the developer gave an approach and/or file list, use Read and Grep to verify them against how those files and patterns actually work, and flag wrong assumptions or missing/adjacent files. If the developer didn't give one or both, investigate the issue and the codebase (similar existing features, naming conventions, directory layout) and infer them yourself — state the inferred approach and file list plainly, as a conclusion, not a question. Report a significant finding only if, after investigating, there are multiple equally-plausible approaches or file sets with no way to tell which is intended, or a developer-given file plainly doesn't exist.

- **Agent 2 — AC coverage check**: Use Read and Grep to inspect the (given or inferred) key files. For each AC item, is there a plausible implementation path given the (given or inferred) approach and files? Report a significant finding only for an AC item where investigation turns up no plausible implementation path at all, or the AC text itself is ambiguous about what's required (not just "needs more detail" if a reasonable reading exists).

- **Agent 3 — Testing strategy**: Read `docs/TESTING.md` first. If the developer gave a testing plan, validate it against the project's testing philosophy. If they didn't, infer one yourself from the AC items and from how similar existing code in this repo is tested:
  - Tests at the lowest appropriate level (unit → integration → component → E2E)
  - E2E only where integration/component tests can't cover it
  - Right frameworks (Vest for validation, Vitest+RTL for frontend unit, MSW for API mocking, Cypress CT for complex UI, Cypress E2E for critical full-stack journeys only)
  - No tests for trivial code, framework internals, or implementation details
  State the inferred testing strategy as a conclusion. Report a significant finding only for an AC item where no testing approach can be determined even by analogy to existing tests.

Synthesize the three reports into: (a) the approach, key files, and testing strategy to use — whatever the developer gave, corrected or filled in by the agents — and (b) a list of significant findings, if any.

## Step 5 — Ask about unclear items only, batched

If Step 4 produced zero significant findings, skip straight to Step 6 — no further questions.

If it produced any, ask about all of them in a **single** message (not one at a time): list each unclear item plainly and ask for a decision or clarification on it. Wait for one combined answer, then proceed to Step 6.

## Step 6 — Generate the story file

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

<The approach from Step 4's synthesis — developer-given and verified, or inferred>

### Key Files

<The key file list from Step 4's synthesis — as a bullet list>

### Testing Strategy

<The testing strategy from Step 4's synthesis>

### Constraints

<Developer-volunteered constraints from Step 3, or "None noted" if none given>
```

Rules:
- Copy AC checkboxes verbatim from the GitHub issue — do not rephrase or reorder
- All boxes start unchecked `[ ]` regardless of issue state
- Keep the file short — only sections that help `/update-story` evaluate commits

## Step 7 — Write the file

Name the file: `<issue-number>-<short-slug-from-title>.md` — e.g. `6032-story-tracking-automation.md`. Use lowercase, hyphens, max 5 words in the slug.

Write it immediately — don't ask the developer to confirm first. This file only tracks the story for `/update-story`; writing it doesn't start implementation and doesn't commit anything, so there's nothing to approve in advance. Create `.claude/stories/` if it doesn't exist.

## Step 8 — Report back and invite corrections

Tell the developer, in one message:
- The file path written
- How many AC items were found
- Which parts (approach / key files / testing strategy) were inferred versus developer-given — call out inferred parts explicitly, since this is the developer's one chance to catch anything the inference got wrong
- That this just created the tracking file — it does **not** start implementation; say so plainly to avoid the file being mistaken for a go-ahead
- That they can edit the file directly, or ask for changes, if anything's off
- That they can run `/update-story` at any point to mark progress and sync to GitHub
