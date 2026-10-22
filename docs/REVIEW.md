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

These standards apply to every pull request into `main`, with these adjustments:

| PR type | What blocks |
| --- | --- |
| Feature, fix and refactor PRs | S0 and S1, as defined below |
| Renovate and other bot PRs | S0 only. Green CI plus a skim of the dependency's breaking changes is enough. |
| Docs-only PRs | Only a factually wrong command, path or rule |
| Hotfixes | S0 and S1 as usual. S2 findings become follow-up tickets instead of holding the fix. |

**Security scanner alerts** (CodeQL, Semgrep, Snyk) map onto the same levels:

- A new High or Critical alert on code the PR adds or changes, with a reachable path, is **S0**.
- Any other new alert is **S2**.
- Alerts that already existed before the PR don't block it.

## Severity Levels

Every finding gets exactly one severity. Only **S0** and **S1** block a merge.

| Level | Definition | Examples in OPS | Merge rule |
| --- | --- | --- | --- |
| **S0** | Data loss or corruption, a security or authorization bypass, wrong money math, a broken migration | Fee applied as 0.05% instead of 5%; budget line totals wrong; a user editing an agreement they don't own; a new `BaseModel` model with no `*_version` table | Blocks merge |
| **S1** | A user-visible bug on a realistic path, or the ticket's acceptance criteria not met | Save does nothing; a validation error never clears; a currency amount shown as a raw float | Blocks merge |
| **S2** | A bug that needs an edge case to appear, a missing test for changed behavior (see [TESTING.md](TESTING.md#when-not-to-write-tests) for when a test isn't needed), an accessibility regression | A crash on a rare filter combination; no test for a new branch in a helper | Doesn't block. The author decides; a reviewer can raise it to S1 by giving an S1 scenario. |
| **S3** | Naming, style, refactor ideas, "consider…" | Extract a helper; rename a prop | Never blocks; fix it or drop it |

What the terms mean:

- **Realistic path:** a user with a normal role can reach it through the UI or API, using inputs that role is allowed to send, in a flow the PR touches.
- **Edge case:** it needs unusual data, a race condition, or database state no normal flow produces.
- **Money math:** computing, aggregating or saving amounts, fees, budget line totals or CAN balances. A display-only formatting error is S1, not S0.

Choosing a level:

- **Pick a level by the outcome your scenario actually shows.** If it only *might* reach a higher level, pick the lower one and say what evidence would raise it.
- **A missing test is S1 only** when the untested code is itself the fix for an S0 or S1, or is money math, authorization or a migration. Otherwise it's S2.

## What Can Block

Only defects that the PR **introduces, makes reachable, or makes worse** can block it.

A problem that already existed in code the PR touches is **pre-existing**. Report it as `Pre-existing`; it never blocks the PR. If it matters, open a ticket for it.

## When a Review Is Done

A review is done when **no S0 or S1 finding is open**. Open S2 and S3 findings don't hold up a merge.

- An AI reviewer will always find *something*. Running more passes to look for more S2 and S3 findings doesn't make the PR safer; it makes it slower.
- A re-review after new commits covers only **the commits since the last review**, plus findings that are still open. It doesn't start over on the whole diff.
- Re-running a review until it stops reporting an S0 or S1 doesn't close that finding. Only a fix, or an agreed won't-fix, closes it.

## Reporting Findings

Human and AI reviewers report each finding in this shape, so findings from different people and tools can be compared. The example below is made up:

```text
[S0] frontend/src/components/Agreements/AgreementFeeSummary.jsx:42
What breaks: The fee is divided by 100 before calculateAgreementTotal, which divides by 100 again.
Scenario:    An agreement with a 5% fee shows a fee of 0.05% of the total on the summary card.
Fix:         Pass fee_percentage straight through; see the fee rule in CLAUDE.md.
```

- **Severity and location** come first. Use `file:line`, or just `file` or `PR` when no single line applies (for example, a missing test or unmet acceptance criteria).
- **What breaks** is the defect in one sentence.
- **Scenario** gives concrete inputs or state that produce the wrong result. A finding with no realistic scenario is S3 at most.
- **Fix** is optional, and a sentence or two at most.

AI reviewers also:

- **End with a verdict line:** `Verdict: BLOCKING (n)` with the number of open S0/S1 findings, or `Verdict: NOT BLOCKING`.
- **List at most 5 S2/S3 findings,** the most important first, and sum up any others in one line.
- **Don't guess acceptance criteria.** If you can't see the ticket, say so and skip the acceptance-criteria check.

## Disputes and Won't-Fix

- **Marking an S0 or S1 as "invalid" or "won't fix" needs a second developer to agree**, recorded in a PR comment. The author can't clear their own blocker alone.
- **A disputed S2** is settled by the human reviewer. If the author and reviewer still disagree, a third developer decides.

## The Human Reviewer's Role

Every PR needs an approving review from a person before it merges.

If the author uses AI review, running it and resolving its findings is the author's job before asking for human review. **Reviewers don't run their own agents to hunt for more S2 and S3 findings.** That adds review rounds and rarely finds blockers. Using a tool to check one specific concern is fine.

The human reviewer checks what agents are bad at:

- **Intent:** does the PR do what the ticket and UX actually need? Name the acceptance criteria you verified.
- **Risk:** name one risk you considered, and which [tier](#risk-tiers) the PR falls in. If the author and reviewer disagree on the tier, use the higher one.
- **Judgment calls:** settle disputed S2s, and confirm or reject any S0/S1 the author wants to mark won't-fix.

## Risk Tiers

A PR's tier is the highest tier of any file it changes. Tiers change only how much **human** review a PR gets. Severity levels are the same at every tier.

| Tier | Typical changes | Human review |
| --- | --- | --- |
| **1** | Copy, styling, isolated UI | One reviewer: intent check |
| **2** | Feature logic, API endpoints and schemas, `backend/openapi.yml` | One reviewer: intent and risk check, reading the changed logic and its tests |
| **3** | Migrations, authorization, fee and budget math, change requests, procurement workflow, audit history, data import, document storage | One reviewer's intent and risk check, plus a full read by a second developer |

A change to fee, migration or authorization logic is Tier 3 even when it's outside the paths below.

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

Notes on these paths:

- `backend/models/**` matches nearly every model file. If it puts too many PRs in Tier 3, narrow it here.
- `frontend/src/helpers/utils.js` holds money and percent helpers (`totalBudgetLineFeeAmount`, `computeDisplayPercents`) next to display-text helpers. A change only to display text there is Tier 2.

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

When the same kind of S1 or S2 finding keeps showing up across PRs, prefer turning it into a deterministic check (a lint rule, a test, a `CLAUDE.md` convention or a project skill) over relying on reviewers to catch it again. Then add it to [Project Rules to Check](#project-rules-to-check).
