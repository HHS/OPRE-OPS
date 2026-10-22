# Code Review Standards

**Purpose:** One shared definition of what blocks a merge and when a review is done, for human and AI reviewers alike
**Audience:** Developers, and any AI agent asked to review an OPS pull request
**Related:** See [TESTING.md](TESTING.md) for which tests to write, and the `CLAUDE.md` files for project conventions

## Table of Contents

1. [Scope](#scope)
2. [Severity Levels](#severity-levels)
3. [What Can Block](#what-can-block)
4. [When a Review Is Done](#when-a-review-is-done)
5. [Reporting Findings](#reporting-findings)
6. [Disputes and Won't-Fix](#disputes-and-wont-fix)
7. [The Human Reviewer's Role](#the-human-reviewers-role)
8. [Risk Tiers](#risk-tiers)
9. [Project Rules to Check](#project-rules-to-check)
10. [Changing This Document](#changing-this-document)

---

## Scope

These standards apply to every pull request into `main`. The adjustments below override the rest of this document:

| PR type | What blocks |
| --- | --- |
| Feature, fix and refactor PRs | S0 and S1, as defined below |
| Renovate and other bot PRs | S0 only. Green CI plus a skim of the dependency's breaking changes is enough. |
| Docs-only PRs | Only a factually wrong command, path or rule, which counts as S1 |
| Hotfixes | S0 and S1 as usual. S2 findings become follow-up tickets. |

**Security scanner alerts** (CodeQL, Semgrep, Snyk) map onto the same levels:

- A new High or Critical alert on code the PR adds or changes, with a reachable path, is **S0**.
- Any other new alert is **S2**, unless it shows a real S0 outcome (for example, an authorization bypass). Then the S0 definition wins over the alert's rating.
- Alerts that already existed before the PR don't block it.

## Severity Levels

Every finding gets exactly one severity. Only **S0** and **S1** block a merge, unless [Scope](#scope) says otherwise.

| Level | Definition | Examples in OPS | Merge rule |
| --- | --- | --- | --- |
| **S0** | Data loss or corruption, a security or authorization bypass, wrong money math, a broken migration | Fee applied as 0.05% instead of 5%; budget line totals wrong; a user editing an agreement they don't own; a new `BaseModel` model with no `*_version` table | Blocks merge |
| **S1** | A user-visible bug on a realistic path, the acceptance criteria not met, or an accessibility defect in new or changed UI (WCAG 2.1 AA is a contractual and ATO requirement) | Save does nothing; a validation error never clears; a currency amount shown as a raw float; a new control that can't be reached by keyboard | Blocks merge |
| **S2** | A bug that needs an edge case to appear, a missing test for changed behavior (see [TESTING.md](TESTING.md#when-not-to-write-tests) for when a test isn't needed) | A crash on a rare filter combination; no test for a new branch in a helper | Doesn't block. The author decides; a reviewer can raise it to S1 by giving an S1 scenario. |
| **S3** | Naming, style, refactor ideas, "consider…" | Extract a helper; rename a prop | Never blocks; fix it or drop it |

What the terms mean:

- **Realistic path:** a user with a normal role can reach it through the UI or API, using inputs that role is allowed to send, in a flow the PR touches.
- **Edge case:** it needs unusual data, a race condition, or database state no normal flow produces.
- **Money math:** computing, aggregating or saving amounts, fees, budget line totals or CAN balances. A display-only formatting error is S1, not S0.
- **Acceptance criteria:** the ones on the linked issue. A story file or the PR description can narrow them only if it says so explicitly.
- **Out of scope:** behavior the ticket deliberately leaves out isn't a bug. UI text that tells users the behavior exists is S2.

Choosing a level:

- **Pick a level by the outcome your scenario actually shows.** If it only *might* reach a higher level, pick the lower one and say what evidence would raise it.
- **A PR that changes money math, authorization or a migration must include a test for that change.** A missing one is S1. Any other missing test is S2.
- **Wrong comments, docstrings or PR descriptions** in a code PR, and **tests in the wrong file** (see [TESTING.md](TESTING.md)), are S3.
- **If a tool uses its own severity scale** (for example Critical/High/Medium/Low), also label each finding S0–S3. Only the S0–S3 label decides whether it blocks.

## What Can Block

Only defects that the PR **introduces, makes reachable, or makes worse** can block it.

A problem that already existed in code the PR touches is **pre-existing**. Report it with the `Pre-existing` prefix and its severity (see [Reporting Findings](#reporting-findings)); it never blocks the PR. If it matters, open a ticket for it.

If a PR fixes part of a pre-existing bug, the parts left unfixed stay pre-existing. The exception is a PR that claims to fix the whole bug: then the unfixed parts are S2.

## When a Review Is Done

A review is done when **no blocking finding is open**: no S0 or S1, unless [Scope](#scope) says otherwise. Open S2 and S3 findings don't hold up a merge.

- An AI reviewer will always find *something*. Running more passes to look for more S2 and S3 findings doesn't make the PR safer; it makes it slower. Verification steps that re-check findings already reported are fine; this is about hunting for new ones.
- A re-review after new commits covers **the commits since the last review, plus any already-reviewed code whose behavior they change** (for example, callers of a helper whose signature or return value changed), and findings that are still open. It doesn't start over on the whole diff.
- Re-running a review until it stops reporting an S0 or S1 doesn't close that finding. Only a fix, or an agreed won't-fix, closes it.

## Reporting Findings

Report each finding in this format, so findings from different people and tools can be compared. A tool with its own required format can keep it, as long as each finding also carries its `[S0]`–`[S3]` or `[Pre-existing S<n>]` label and the review ends with the verdict line below:

```text
[<severity>] <location>
What breaks: <the defect, in one sentence>
Scenario:    <concrete inputs or state that produce the wrong result>
Fix:         <optional; a sentence or two>
```

- **`<severity>`** is `S0`, `S1`, `S2` or `S3`. For a pre-existing problem, write `Pre-existing` before it, for example `[Pre-existing S1]`.
- **`<location>`** is `path:line`, or just `path` or `PR` when no single line applies (for example, a missing test or unmet acceptance criteria).
- **The labels** `What breaks:`, `Scenario:` and `Fix:` are fixed and come in that order. `Fix:` can be left out.
- **A finding with no realistic scenario** is S3 at most.

This example is made up:

```text
[S0] frontend/src/components/Agreements/AgreementFeeSummary.jsx:42
What breaks: The fee is divided by 100 before calculateAgreementTotal, which divides by 100 again.
Scenario:    An agreement with a 5% fee shows a fee of 0.05% of the total on the summary card.
Fix:         Pass fee_percentage straight through; see the fee rule in CLAUDE.md.
```

AI reviewers also:

- **End with exactly one verdict line:** `Verdict: BLOCKING (n)`, where `n` is the number of open blocking findings, or `Verdict: NOT BLOCKING`.
- **List at most 5 S2/S3 findings** that you report as real, the most important first, and sum up any others in one line. Findings a tool checked and rejected don't count toward the 5.
- **Don't guess acceptance criteria.** If you can't see the linked issue, say so and skip the acceptance-criteria check.

## Disputes and Won't-Fix

- **Marking an S0 or S1 as "invalid" or "won't fix" needs a second developer to agree**, recorded in a PR comment. The author can't clear their own blocker alone.
- **A disputed S2** is settled by the human reviewer. If the author and reviewer still disagree, a third developer decides.

## The Human Reviewer's Role

Every PR needs an approving review from a person before it merges.

If the author uses AI review, running it and resolving its findings is the author's job before asking for human review. **Reviewers aren't expected to run their own agents to hunt for more S2 and S3 findings.** That adds review rounds and rarely finds blockers. Using a tool to check one specific concern is fine.

The human reviewer checks what agents are bad at:

- **Intent:** does the PR do what the ticket and UX actually need? Name the acceptance criteria you verified.
- **Risk:** name one risk you considered, and which [tier](#risk-tiers) the PR falls in. If the author and reviewer disagree on the tier, use the higher one.
- **Judgment calls:** settle disputed S2s, and confirm or reject any S0/S1 the author wants to mark won't-fix.

## Risk Tiers

Tiers change only how much **human** review a PR gets. Severity levels are the same at every tier. A PR's tier is the highest tier of any change it makes.

| Tier | Typical changes | Human review |
| --- | --- | --- |
| **1** | Copy, styling, isolated UI | One reviewer: intent check |
| **2** | Feature logic, API endpoints and schemas, `backend/openapi.yml`, read-only or display-only changes in Tier 3 files | One reviewer: intent and risk check, reading the changed logic and its tests |
| **3** | Changes to money math, authorization, migrations, workflow state (change requests, procurement), audit history, data import, document storage, or other data writes | One reviewer's intent and risk check, plus a full read by a second developer |

A file on the list below makes a PR Tier 3 only when **the changed lines** touch money math, authorization, migrations, workflow state or data writes. A change to that kind of logic is Tier 3 even when it's outside these paths.

Tier 3 paths:

```text
backend/alembic/**
backend/alembic.ini
backend/models/**
backend/data_tools/**
backend/ops_api/ops/__init__.py
backend/ops_api/ops/auth/**
backend/ops_api/ops/document/**
backend/ops_api/ops/validation/**
backend/ops_api/ops/events/**
backend/ops_api/ops/services/{budget_line_items,agreements,agreement_edit_bundle,change_requests,procurement_*,can_funding_*,cans,message_bus,users}.py
backend/ops_api/ops/utils/{cans,reporting_summary,budget_line_items_helpers,agreements_helpers,change_requests_helpers,users}.py
frontend/src/helpers/{agreement,budgetLines,procurementShop,currencyFormat,changeRequests,safeRedirect}.helpers.js
frontend/src/helpers/utils.js
frontend/src/components/Auth/**
frontend/src/api/opsAuthAPI.js
```

## Project Rules to Check

These rules already live elsewhere. Reviewers check against them; this document doesn't restate them.

| Rule | Where it's defined | Breaking it is usually |
| --- | --- | --- |
| Fee percentages are whole numbers (`5.0` = 5%), never pre-divided | [CLAUDE.md](../CLAUDE.md#fee-percentage-format-convention), [backend](../backend/ops_api/CLAUDE.md#fee-percentage-format), [frontend](../frontend/CLAUDE.md#fee-percentage-storage) | S0 |
| Routes use `@is_authorized`; agreement edits check ownership (`associated_with_agreement`, `check_user_association` in `ops/utils/agreements_helpers.py`) | [backend/ops_api/CLAUDE.md](../backend/ops_api/CLAUDE.md#authorization) | S0 |
| Migrations are reviewed before applying; a new `BaseModel` model also needs its sqlalchemy-continuum `*_version` table | [backend/ops_api/CLAUDE.md](../backend/ops_api/CLAUDE.md#database-migrations), `/db-migrations` skill, `backend/models/base.py` | S0 |
| Static data import only writes tables in the `ALLOWED_TABLES` allowlist | [backend/data_tools/CLAUDE.md](../backend/data_tools/CLAUDE.md) | S0 |
| `backend/openapi.yml` stays in sync after endpoint changes | [backend/ops_api/CLAUDE.md](../backend/ops_api/CLAUDE.md#api-documentation-openapi), `/sync-openapi` skill | S2 |
| Currency shows exactly two-digit cents; percentages follow the `<1%` and 99-cap rules | [frontend/CLAUDE.md](../frontend/CLAUDE.md#numeric-display-conventions) | S1 when users see a wrong value, otherwise S2 |
| Vest v6 validation patterns, including no `only(data)` | [frontend/CLAUDE.md](../frontend/CLAUDE.md#vest-v6-form-validation-patterns), `vest-error-key-lifecycle` skill | S1 or S2 |
| Unsaved-changes guards with `useBlocker` | `useblocker-bypass-regression-test` skill | S1 |
| 90%+ code coverage. This is a documented convention; CI doesn't enforce a threshold. | [pull request template](../.github/pull_request_template.md), [frontend/CLAUDE.md](../frontend/CLAUDE.md#running-tests) | S2 |
| Which kind of test to add, and when not to add one | [TESTING.md](TESTING.md) | S2 |
| Accessibility impact noted on the PR | [pull request template](../.github/pull_request_template.md) | S2 |

## Changing This Document

This is a team standard. Change it through a normal PR that the whole team can review.

The **Code Review** section of the root [CLAUDE.md](../CLAUDE.md#code-review) summarizes this document, because some AI review tools read only `CLAUDE.md` files. Change both in the same PR. If they ever differ, this document wins.

When the same kind of S1 or S2 finding keeps showing up across PRs, prefer turning it into a deterministic check (a lint rule, a test, a `CLAUDE.md` convention or a project skill) over relying on reviewers to catch it again. Then add it to [Project Rules to Check](#project-rules-to-check).
