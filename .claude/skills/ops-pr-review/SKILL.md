---
name: ops-pr-review
description: Run the shared AI review of an OPRE-OPS pull request — Flexion's code-review-orchestrator, held to the team rubric in docs/REVIEW.md (S0–S3 severities, risk tiers, pre-existing findings, the verdict line). Use whenever someone asks to review an OPS PR or branch ("review PR 6436", "review my PR", "run the shared review", "is this ready for human review", "re-review after my changes"). Prefer this over calling code-review-orchestrator directly in this repo, so every review uses the same bar for "done".
argument-hint: "[pr-number]"
allowed-tools: Read, Grep, Glob, Bash, Agent, Skill
---

# Shared PR Review (OPRE-OPS)

This skill runs `flexion-engineer-base:code-review-orchestrator` and holds its output to [`docs/REVIEW.md`](../../../docs/REVIEW.md). The orchestrator decides **which reviewers run and how findings are verified**. REVIEW.md decides **what severity a finding has, what blocks, and when the review is done**. Where they disagree, REVIEW.md wins.

Don't restate REVIEW.md from memory: read it at the start of every run, because it changes through team PRs.

## 1. Set up

1. **Read `docs/REVIEW.md` in full.** You will pass its Severity Levels, What Can Block, Reporting Findings and Project Rules to Check sections to every reviewer agent.
2. **Find the PR.** Use `$ARGUMENTS` if given; otherwise `gh pr view --json number`. With no PR, review `git diff origin/main...HEAD` and skip the steps that need one (Turn 0, posting).
3. **Gather context:**
   ```bash
   gh pr view <n> --json number,title,body,author,isDraft,headRefOid,baseRefName,files,labels
   gh pr diff <n>
   ```
   Find the linked issue in the PR body and read its acceptance criteria with `gh issue view <issue>`. Don't guess the criteria.
4. **Work out your role.** Compare `gh api user --jq .login` with the PR's author:
   - **Author mode:** you're running it on your own PR, to get it ready for human review. Steps 3–6 describe this mode unless they say otherwise.
   - **Reviewer mode:** you're running it on someone else's PR. The review is the same; what changes is the baseline (step 3), what you compare against (step 5) and how it's posted (step 6).
5. **Check the plugin.** If the `flexion-engineer-base:code-review-orchestrator` skill isn't available, stop and tell the user to enable the Flexion plugin. Don't fall back to an ad-hoc review: the point is that everyone runs the same one.

## 2. Classify the PR

Decide both from REVIEW.md before launching any reviewer, and state them at the top of the report:

- **Scope** (REVIEW.md → Scope): feature/fix/refactor, bot, docs-only, tooling or hotfix. This sets what can block. For a bot PR only S0 blocks, so a skim of the dependency's breaking changes plus green CI is enough; run the orchestrator only if the bump touches auth, data writes or the build.
- **Risk tier** (REVIEW.md → Risk Tiers): the highest tier of any change, judged by **the changed lines**, not just the path list.

**Ask before launching reviewers when something is missing that the review needs.** Put all questions in one short message, and only these:

- **No linked issue found, or you can't read it:** ask which ticket the PR is for. If the user doesn't know, skip the acceptance-criteria check and say so in the report.
- **Tier unclear:** for example, a Tier 3 path where you can't tell from the diff whether the changed lines touch a data write. Ask, and use the higher tier if the user isn't sure (REVIEW.md: when in doubt, the higher tier wins).

When the PR has a readable issue and an obvious tier, don't ask anything; start the review.

## 3. Pick the mode

Look for an earlier shared-review result on the PR: a PR comment **by the PR's author** containing the marker `<!-- shared-review sha=<commit> -->`. Ignore markers from anyone else.

```bash
gh pr view <n> --json author,comments --jq '.author.login as $a | .comments[] | select(.author.login == $a and (.body | contains("<!-- shared-review sha="))) | {createdAt, body}'
```

**Author mode:**

- **No earlier result → full review.** Use the orchestrator's Multi-Turn Adversarial mode.
- **Earlier result exists → Delta Re-Review**, using the `sha` in the **most recent** marker as the baseline. This replaces the orchestrator's own baseline lookup, which only looks at formal GitHub reviews and wouldn't find the comment. Following REVIEW.md, the scope is the commits since that SHA, plus already-reviewed code whose behavior they change, plus findings from that result that are still open.
- **Earlier result's sha equals the current head → don't re-run.** Report the existing result. Re-running on the same commit to hunt for more findings isn't part of the process (REVIEW.md → When a Review Is Done).

**Reviewer mode:**

- **You haven't reviewed this PR before → full review** at the current head.
- **You have → Delta Re-Review**, using the orchestrator's own baseline lookup: your most recent GitHub review on the PR.
- Either way, keep the author's most recent shared-review result (if any) for the comparison in step 5. Its findings aren't new to the author, so don't spend skeptic turns on ones you agree with.

**Delta scope (both modes).** Don't diff the baseline straight to HEAD: if the author merged the base branch in since then, that diff includes other people's merged code. Instead, review the hunks of the current PR diff (`gh pr diff <n>`) in files that changed since the baseline:

```bash
git merge-base --is-ancestor <baseline> <headRefOid> && git diff --name-only <baseline> <headRefOid>
```

Intersect that file list with `gh pr diff <n> --name-only`, then add already-reviewed code whose behavior those hunks change. If the baseline commit is missing or isn't an ancestor of the head (after a rebase or force-push), the command fails: tell the user and do a full review instead.

**Skeptic turns:** N = 3 for Tier 3 PRs, N = 2 otherwise.

## 4. Run the orchestrator

The reviewer agents can only read files; they can't run `git` or `gh`. Whatever branch the user has checked out isn't necessarily the PR (in reviewer mode it rarely is), so before launching them, put the PR's own code and the base versions in a scratch directory outside the repo and point every brief at those paths, never at the working tree:

```bash
SCRATCH=$(mktemp -d)
git fetch origin <base> "pull/<n>/head"                      # makes <headRefOid> and origin/<base> current
git worktree add --detach "$SCRATCH/head" <headRefOid>       # the full PR tree, for reading consuming code
gh pr diff <n> > "$SCRATCH/pr.diff"
for f in $(gh pr diff <n> --name-only); do                   # base copy of each changed file
  mkdir -p "$SCRATCH/base/$(dirname "$f")"
  git show "origin/<base>:$f" > "$SCRATCH/base/$f" 2>/dev/null || { rm -f "$SCRATCH/base/$f"; echo "added in PR: $f"; }
done
```

Also write the PR body and the linked issue there. Files missing under `base/` are new in the PR. When the review is done, remove the worktree with `git worktree remove --force "$SCRATCH/head"`.

Invoke the `flexion-engineer-base:code-review-orchestrator` skill in the mode above and follow it, with these additions to every reviewer agent's launch brief and every skeptic's brief:

1. **Include the REVIEW.md sections** from step 1, the PR's scope and tier, and the acceptance criteria (or "not available").
2. **Label every finding S0–S3 by REVIEW.md's definitions,** alongside the orchestrator's Likelihood × Impact score. The S label decides blocking; the Critical/High/Medium/Low label doesn't.
3. **Never drop a finding that meets the S0 or S1 definition** because its score falls below the orchestrator's reporting floor or because its Impact is Minor. For example, an accessibility defect in changed UI or an unmet acceptance criterion is S1 even if it scores Low.
4. **Every finding needs a concrete scenario** (inputs or state that produce the wrong result). Without one it is S3 at most. Pick the level by the outcome the scenario actually shows, not the worst case it might reach.
5. **Check whether the PR caused it.** Only defects the PR introduces, makes reachable or makes worse can block. Anything else is reported as `[Pre-existing S<n>]`. Compare against the PR's base branch (`baseRefName`), which isn't always `main`: stacked PRs target another feature branch.
6. **Check the Project Rules to Check table** (fee percentages, `@is_authorized` and ownership checks, `*_version` tables, `ALLOWED_TABLES`, OpenAPI sync, numeric display, Vest, `useBlocker`, and the required tests for money math, authorization, migrations, workflow state and data writes).
7. **Skeptics re-derive the S label independently**, citing code. If a skeptic's S label differs from Turn 1's, the skeptic's label wins, the same as the orchestrator's rule for scores.
8. **A resolved or outdated thread doesn't close an S0/S1.** This overrides the orchestrator's Turn 0 suppression rule for blockers: suppress an S0/S1 on a resolved thread only if the code at that location changed to fix it, or a PR comment records a second developer agreeing to won't-fix (REVIEW.md → Disputes and Won't-Fix). Otherwise report it as `REOPENED` and cite the unchanged code. Suppression still applies to S2/S3.

If the PR has open CodeQL, Semgrep or Snyk alerts on lines it changed, map them with REVIEW.md's scanner rules and include them as findings.

## 5. Report

Keep the orchestrator's disposition table, with a **Final S** column added. Then:

- **Header:** PR number, head SHA reviewed, scope, tier, mode (full or delta from `<sha>`), N.
- **Blocking findings:** every **open** S0 and S1 that blocks under the PR's Scope, in REVIEW.md's format. Open means a surviving finding from this run, plus any S0/S1 the orchestrator listed as **Already tracked** (tag it `[tracked]` and link the thread), plus any prior finding the delta's resolution table marks `UNRESOLVED` or `PARTIALLY-RESOLVED` (tag it `[unresolved]`). Give tracked and unresolved items an S label too if they don't have one.
  ```text
  [<severity>] <location>
  What breaks: <the defect, in one sentence>
  Scenario:    <concrete inputs or state that produce the wrong result>
  Fix:         <optional; a sentence or two>
  ```
- **Non-blocking:** at most 5 S2/S3 findings, most important first; sum up any others in one line. Rejected findings don't count toward the 5.
- **Pre-existing:** listed separately with their `[Pre-existing S<n>]` labels.
- **Reviewer mode only, compared with the author's result:** for each surviving S0/S1, say whether the author's most recent shared-review result reported it. Tag the ones it didn't with `[missed]` right after the severity, for example `[S1][missed] path:line`. If the author's result was on an older commit, a finding counts as missed only if its code was already in that commit. If the author posted no result, say so and tag nothing.
- **Last line, exactly one of:** `Verdict: BLOCKING (n)` or `Verdict: NOT BLOCKING`, where `n` is the number of findings in the Blocking list. A finding that doesn't block under the PR's Scope (any S1 on a bot PR; an S1 on a docs-only or tooling PR that isn't a broken command, path or rule) goes in Non-blocking instead and isn't counted.

A clean run is one whose verdict is `NOT BLOCKING` on the PR's current head commit. Re-running until a finding disappears doesn't close it; only a fix, or a won't-fix agreed by a second developer in a PR comment, does.

## 6. Post (only when the user says so)

Show the report to the user first, in markdown in the conversation. Post it on the PR only when they ask, and never on a draft PR: if the PR is a draft, stop and ask. You can offer the draft you'd post, but don't post it until they say so.

**Author mode:**

- Post it as one PR comment with `gh pr comment <n> --body-file <file>`, and put `<!-- shared-review sha=<head sha reviewed> -->` on its first line so the next run can find its baseline.
- If the verdict is `NOT BLOCKING` and the repo has a `ready-for-human-review` label, offer to add it. Don't create labels. Check with an exact match, since `gh label list --search` is fuzzy and returns other labels when this one doesn't exist:
  ```bash
  gh label list --limit 500 --json name --jq '.[].name' | grep -qx ready-for-human-review
  ```
- If commits land after posting, the result applies only up to its SHA; a delta run on the new head is needed before the PR counts as clean again.

**Reviewer mode:**

- Draft it as a GitHub review, not a comment. Show the user the draft (event, body and each inline comment) before submitting it.
  - **Inline comments:** one per surviving S0/S1 whose line is in the diff, in REVIEW.md's finding format with its `[missed]` tag if it has one.
  - **Body:** the header, any S0/S1 that has no diff line, the non-blocking and pre-existing lists, and the verdict line.
  - **Event:** `REQUEST_CHANGES` if the verdict is `BLOCKING`, otherwise `COMMENT`. Never `APPROVE`: approving is the human reviewer's decision, made after the intent and risk checks in REVIEW.md.
- Submit it in one call, so it lands as one review with its inline comments:
  ```bash
  gh api repos/{owner}/{repo}/pulls/<n>/reviews --input review.json
  ```
  where `review.json` has `commit_id` (the head SHA reviewed), `event`, `body` and `comments`. Each comment has `path`, `line`, `side` and `body`: use `side: "RIGHT"` with the new file's line number, or `side: "LEFT"` with the old file's line number for a finding on a deleted line (for example a removed `@is_authorized`). If you can't place a finding on a line that's in the diff, put it in the body instead; one bad line makes GitHub reject the whole review.
- If any finding is tagged `[missed]` and the repo has a `missed` label (`gh label list --limit 500 --json name --jq '.[].name' | grep -qx missed`), offer to add it to the PR. Don't create labels.
