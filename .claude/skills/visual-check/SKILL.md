---
name: visual-check
description: Use when the user asks to visually check, eyeball, screenshot, or review the UI of their current branch/PR in OPRE-OPS ("does this look right", "visual check", "check the UI changes"). Drives the running app (or Storybook) with Playwright MCP, screenshots the pages/components the diff touches at desktop and mobile widths, and reports visual, a11y, and console issues.
argument-hint: [pr# | route | figma-url]
---

# Visual Check (OPRE-OPS)

Look at the UI the current branch changes the way a reviewer would, and report what's wrong. Screenshots are evidence for the report, not the deliverable.

## Prerequisites
- **Playwright MCP** for driving the browser (`browser_navigate`, `browser_take_screenshot`, etc.). Required for every run. The project's `.mcp.json` configures it with `--output-dir /tmp/playwright-mcp`, so captures land there, not in the repo. Also needs Google Chrome installed locally — the server launches it by default, and the first browser call fails without it.
- **Figma MCP** for design comparison (step 6) — only needed if a Figma link is in play. Note Figma's per-seat MCP rate limits: View/Collab seats get 20 read calls/month, which a single design-comparison run can mostly consume; Dev/Full seats get 200–600/day. If calls are failing with a rate-limit error, say so rather than reporting "no differences found."
- Check they're available before starting. If Playwright MCP is missing, tell the user and stop — the skill can't run without it. If only Figma MCP is missing, skip step 6 and say so explicitly in the report instead of guessing at design intent.

## Inputs
- Default target: current branch diffed against `origin/main`.
- User may instead name routes, components, a PR number, or a Figma URL. For a **PR number**: `gh pr diff <num> --name-only` to get changed files (and `gh pr checkout <num>` first if you need to run the app against it), rather than diffing whatever branch happens to be checked out.
- Mode: **app** (full stack, real data) or **storybook** (isolated component states). Pick app if the diff touches `src/pages/` or routing; storybook if it only touches `src/components/UI/` and stories exist; ask if unclear.

## Workflow

```
- [ ] 1. Scope: map the diff to routes / stories
- [ ] 2. Make sure the target is running
- [ ] 3. Sign in (app mode)
- [ ] 4. Capture each target at desktop + mobile
- [ ] 5. Inspect: visual, a11y tree, console
- [ ] 6. Compare to design (if a Figma link exists)
- [ ] 7. Report; clean up
```

**1. Scope.** `git fetch origin main && git diff --name-only origin/main...HEAD -- frontend/src` (fetching first avoids a stale local `main` pulling in unrelated commits). Map changed files to what to look at:
- `src/pages/<X>/...` → find its route in the router (`grep -n 'path="' frontend/src/index.jsx` — routes are JSX attributes, not object-literal `path:`) → URL(s).
- `src/components/...` → find which pages render it (`grep -rln "<ComponentName"`), and its `*.stories.jsx` if any.
- Also read the branch's story file in `.claude/stories/` if one matches the ticket number — it states intended behavior and states to check.
- **Ticket number** = digits from the branch name (`OPS-6328/...` → `6328`). Many branches are ticket-less by convention (`docs/...`, `OPS/hotfix-...`, per root `CLAUDE.md`) — if the branch name has no digits, skip the ticket-based lookups below (story file glob, `gh issue view`) rather than running them with an empty/garbage ticket value.
- **Collect Figma links** (used in step 6). Search, in order, and keep every `figma.com/(design|file|proto)/...` URL found:
  1. Storybook stories for changed components (no ticket needed): `parameters.design.url` (or any figma.com URL) in the co-located `*.stories.jsx`.
  2. Story file(s), only if a ticket number was found: `grep -oE "https://www\.figma\.com/[^ )>\"']+" .claude/stories/*<ticket>*.md` — usually on a `**Design:**` line.
  3. The GitHub issue, only if a ticket number was found: `gh issue view <ticket> --json body,comments` and grep the same pattern.
  Note which link came from where, and which target each one maps to (by `node-id` or surrounding text). Links without a `node-id` point at a whole file — ask the user which frame rather than guessing.
List the targets (and any Figma links found) to the user in one line before capturing. Cap at ~6 targets; ask before doing more.

**2. Running?** App: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` and `:8080`. If not up, tell the user and offer `docker compose up --build -d` — takes minutes; don't start it silently. Storybook: `http://localhost:6006`; offer `cd frontend && bun run storybook` in the background.

**3. Sign in (app mode only).** Navigate to `http://localhost:3000/login`, click "Sign in with FakeAuth®", choose the user type (default `system_owner`; use `basic_user` when checking permission-dependent UI). These are local seeded test users only.

**4. Capture.** For each target, at **1280×800** and **375×812** (`browser_resize`):
- Navigate, `browser_wait_for` the main content (not a fixed sleep), then `browser_take_screenshot` (full page).
- Capture the states the change affects: empty, loading, error, long text, hover/focus, open modal, validation errors. Use the story file / diff to decide which matter — don't capture every state of every page.
- Save with a relative filename (`<target>-<width>-<state>.png`) — Playwright MCP resolves explicit filenames against its workspace/output root and **rejects** an absolute path outside it (`File access denied: ... is outside allowed roots`). With the project's `--output-dir /tmp/playwright-mcp` config, use `mktemp -d /tmp/playwright-mcp/visual-check.XXXX` for the report's temp dir — paths under there are allowed.

**5. Inspect** each capture:
- Look at the screenshot: overlap, clipping, truncation, misalignment, wrong USWDS spacing/colors, broken responsive layout, missing icons, unstyled elements.
- `browser_snapshot` (accessibility tree): missing labels/names, wrong heading order, buttons that aren't buttons.
- `browser_console_messages`: React warnings, failed requests, errors.
- For exact pixel values (padding, font size, color) use `browser_evaluate` with `getComputedStyle` — never estimate measurements from the image.

**6. Design comparison** (if the user gave a Figma URL or step 1 found one; otherwise say "no design link found" in the report): pull the frame with Figma MCP `get_screenshot` / `get_design_context`, compare layout, tokens, copy, and states. Report differences, not similarities.
- **Measure spacing, don't eyeball it.** Screenshot comparison misses small padding/margin/gap differences. For each target's main containers (card, section, heading, form group — ~3–6 elements), take padding, margin, gap, font-size, line-height, and color from `get_design_context`, read the same properties via `browser_evaluate` + `getComputedStyle`, and list mismatches beyond ±2px. Map Figma values to USWDS spacing units (1 unit = 8px) when naming the expected value.
- **Classify text differences.** Static copy (headings, labels, button text, help text, empty-state messages) → 🟠 off-spec. Data-driven text (names, amounts, dates, counts, IDs — anything that comes from the API/seed data) → ℹ️ "likely mock data in design", one line, unless the *format* differs (e.g. `$1,000` vs `$1000.00`, date format), which is 🟠.

**7. Report**, grouped by target, most severe first:
- 🔴 broken (unusable, overlapping, data wrong) · 🟠 off-spec (doesn't match design/intent) · 🟡 polish · ℹ️ console/a11y notes
- Each finding: what, where (target + width + state), screenshot path, and the likely source file if obvious.
- **Introduced vs. pre-existing.** File membership in `git diff --name-only origin/main...HEAD` is a coarse first pass, not proof: a pre-existing bug in a touched file still counts as "in the diff," and a bug caused by new markup interacting with an *unchanged* stylesheet won't show up this way at all. If the file isn't in the diff, or the before/after baseline (optional section below) shows the same issue on `main`, put it in a separate **Pre-existing (not from this branch)** section at the end — still reported, but not counted against the branch. If you didn't run a before/after baseline and the file-diff check is your only signal, say so and mark the attribution as uncertain rather than asserting it confidently.
- **Shared components → design decision, not a local fix.** If the responsible code is a shared component (`src/components/Layouts/**`, `src/components/UI/**`, or anything imported by 3+ pages — check with `grep -rln "<Name"`), mark it ⚖️ **needs UX decision**, list the pages it affects, and don't suggest a page-level override. The question for UX is "change the shared component everywhere, or change the design?"
- End with what was NOT checked (states skipped, targets capped).
Leave the temp dir in place and tell the user the path (they may want to attach images to the PR). Don't edit code unless asked.

## Before/after (optional)
If the user wants a baseline: run steps 3–4 on `origin/main` first (they check it out / restart), saving with an `-before` suffix, then on the branch with `-after`, and report differences between the pairs.

## Lessons
- Screenshot comparison alone misses small padding/margin/gap differences — always pull numeric values via `get_design_context` and `getComputedStyle` rather than eyeballing images.
- Data-driven text (names, amounts, dates from seed data) frequently differs from Figma's mock data without being a real bug — classify by format, not by exact-match.
- A visual mismatch traced to a shared component (e.g. `TablePageLayout`) is a UX decision, not a branch-level fix — flag it ⚖️ rather than suggesting a page-level override.
