---
name: vest-error-key-lifecycle
description: Use when adding, removing, or renaming a Vest validation `test(...)` in this repo's suite.js / *Suite.js files, or when touching a validation error key like "team-members" / "project-officer". Maps the full producer→consumer chain (test → getErrors() → convertCodeForDisplay("validation", key) → error-list render → button gating) so a suite edit updates every dependent label, renderer, and test. Trigger on any Vest suite change.
---

# Vest Error-Key Lifecycle

## Overview

A Vest `test("some-key", ...)` in this repo does not just validate — it **produces an error key** (`"some-key"`) that flows through several other files that never import the suite. Add, rename, or delete a test and you touch that whole chain, but nothing links the files at compile time, so a partial edit leaves a broken label, an orphaned rendered error, or a stale button-gate.

**Core principle:** The Vest error key is a **contract string** shared across the suite, the display-label map, the error-list renderer, and the button-gating logic. Treat every suite edit as a change to that contract, and update all four ends.

## The Chain

For a key like `"team-members"`, the lifecycle is:

```
1. PRODUCE   test("team-members", "msg", () => enforce(...))   in suite.js / *Suite.js
                    │  emits the key into the result
                    ▼
2. READ      suite.get() / result.getErrors()                  → { "team-members": [...] }
                    │
                    ├─▶ 3a. GATE   res.hasErrors() disables Continue / Send-to-Approval
                    │             (e.g. shouldDisableBtn in AgreementEditForm.hooks.js)
                    │
                    ├─▶ 3b. REVALIDATE  handlers call runValidate("team-members", ...)
                    │             on field change (add/remove item)
                    │
                    └─▶ 3c. RENDER  Object.entries(pageErrors).map(([key]) =>
                                     convertCodeForDisplay("validation", key))
                                     in ReviewAgreement.jsx  (error list)
                                          │
                                          ▼
4. LABEL     codesToDisplayText.validation[key] in src/helpers/utils.js
             maps "team-members" → "Team Members" for display
```

Each numbered node is a **different file**. A grep of the key string is how you find them all — imports won't lead you there.

## When you edit a suite

### Removing a `test("key", ...)`

Grep the key string repo-wide and clean up every dependent:

```bash
grep -rn '"team-members"\|team-members' src/ | grep -v "\.test\."
```

- **3a Gate** — usually self-heals: `hasErrors()` just stops seeing the key. Verify no code special-cases the key by name.
- **3b Revalidate** — remove now-dead `runValidate("key", ...)` calls in change handlers; the test they targeted is gone.
- **3c Render** — `getErrors("key")` / the error-list map now yields nothing for the key; confirm nothing renders an empty shell.
- **4 Label** — the `validation[key]` entry in `utils.js` is now **orphaned**. Remove it. (ESLint will NOT flag it — it's an object key, not a binding.)
- **Tests** — update any co-located suite test asserting `toHaveProperty("key")`; flip "fails if empty" → "passes if empty" when removing a completeness rule.

### Adding a `test("key", ...)`

- Add a matching label to `codesToDisplayText.validation` in `src/helpers/utils.js`, or the error list renders the raw key (`convertCodeForDisplay` falls back to the code itself when unmapped).
- If a change handler should revalidate the field live, add a `runValidate("key", value)` call.
- Add a suite unit test asserting the key appears/absent as expected.

### Renaming a key

Rename at **all four** nodes atomically: the `test()` name, any `runValidate`/`getErrors` string, the `validation` label key, and test assertions.

## Vest v6 rules (repo convention — see frontend/CLAUDE.md)

These are easy to break while editing a suite:

- `suite.run(data)` — **not** `suite(data)` (v5 API throws in v6).
- `isNotBlank()` fails on **numbers** — for numeric fields (ids, amounts) use `enforce(n).isNotNullish().greaterThan(0)`.
- Do **not** call `only(dataObject)` with the whole form object — skipped tests retain prior failed state → phantom errors. Pass a field-name string or omit `only()`.
- Don't call `suite.reset()` during render — store results via `useEffect` (see `ReviewAgreement.hooks.js`).

## Quick Reference

| Node | File (representative) | Update on remove? | ESLint catches a miss? |
|---|---|---|---|
| Produce (`test`) | `pages/agreements/review/suite.js`, `AgreementEditFormSuite.js` | delete the block | n/a |
| Gate (`hasErrors`) | `AgreementEditForm.hooks.js` (`shouldDisableBtn`) | usually self-heals | — |
| Revalidate (`runValidate`) | `AgreementEditForm.hooks.js` handlers | remove dead calls | ✅ if arg var unused |
| Render (`convertCodeForDisplay`) | `pages/agreements/review/ReviewAgreement.jsx` | verify no empty render | ❌ |
| Label (`validation` map) | `src/helpers/utils.js` | **remove orphaned key** | ❌ |
| Tests | co-located `suite.test.js` | flip/remove assertions | test run catches |

## Common Mistakes

- **Deleting the `test()` and stopping.** The label in `utils.js` and any `runValidate("key")` calls are now dead. Grep the key string.
- **Trusting lint to find the orphaned label.** `validation["team-members"]` is object data, not a binding — ESLint never flags it. Grep the string, remove by hand.
- **Adding a `test()` without a label.** The error list will render the raw key (e.g. `team-members`) instead of `Team Members`, because `convertCodeForDisplay` returns the code when unmapped.
- **Confusing completeness with authorization.** A Vest `test()` checks whether the form *has* data (completeness). "Only team members can send to approval" tooltips are a separate backend **authorization** check (`check_user_association`) — do not conflate them when editing a suite.
- **Singular vs plural key drift.** `utils.js` may carry both `"team-member"` and `"team-members"`. Only remove the one your deleted test actually produced; leave unrelated siblings.

## Real-World Impact

OPS-5882 removed the `team-members` Vest test from two suites. Lint passed and a first review passed, but the `"team-members": "Team Members"` label in `utils.js` (node 4) was left orphaned — its only consumer was `convertCodeForDisplay("validation", key)` in `ReviewAgreement.jsx` (node 3c). Walking the chain above catches all four nodes in one pass. For the general technique beyond Vest, see the `dead-code-after-removal-sweep` skill.
