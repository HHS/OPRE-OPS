---
name: dead-code-after-removal-sweep
description: Use after deleting a feature, function, component, validation rule, config flag, enum value, status, or any symbol — frontend or backend — to find the downstream artifacts the deletion orphaned. Covers orphaned string keys in object/label/i18n maps, user-facing copy, OpenAPI enums, dead branches, now-unused imports/props, stale comments, and test fixtures that lint and code review miss. Trigger when you removed code and want a clean, zero-dead-code diff.
---

# Dead-Code-After-Removal Sweep

## Overview

When you delete something, the thing you deleted usually had **dependents** — code and data elsewhere that only existed to serve it. Deleting the definition without sweeping its dependents leaves dead code: it compiles, it lints, all tests pass, and the reviewer often misses it too. It just sits there, quietly wrong, until it confuses the next person.

**Core principle:** A removal is not "the definition." A removal is "the definition **and everything that only existed for it**." Sweep for dependents on the same commit that deletes the definition.

## Why lint and review are not enough

`bun run lint` (ESLint `no-unused-vars`) and `pipenv run nox -s lint` (flake8, which flags unused imports) catch unused **bindings** — a variable, import, or parameter no longer referenced. They do **not** catch:

- **Orphaned entries in object/dictionary maps** — a key like `"team-members": "Team Members"` in a label map is not a binding; nothing flags it when its only consumer disappears.
- **String-keyed lookups** — `errors["team-members"]`, `labels[key]`, `dispatch({ type: "X" })`. The key is data, not a symbol.
- **Now-unreachable branches** — an `if (mode === "legacy")` whose only caller you removed.
- **Stale comments and JSDoc** — prose describing behavior that no longer exists.
- **Test fixtures / mock data** — fields set only to satisfy the rule you deleted.
- **Non-code mentions** — `backend/openapi.yml` enum lists and descriptions, user-facing copy (UI text, API error messages), Cypress comments, seed data.

This repo has **no** `knip` / `ts-prune` / `depcheck` on the frontend and no `vulture`-style detector on the backend. Lint is the only static safety net, so the orphan classes above must be swept **manually**. (This is exactly the class of miss that survives review: a reviewer verifies the binding-level cleanup lint already guarantees, and the data-level orphan slips through.)

## The Sweep

Run this checklist on the **same branch** as the deletion, before you call the work done.

### 1. Name the tokens you removed

List every identifier and **string literal** tied to the deleted thing:

- Symbol names: function/component/const/type names.
- **String keys**: error keys, action types, label-map keys, route paths, `data-cy` attributes, event names, feature-flag strings, enum string values.

The string keys are the ones that bite. Write them down explicitly.

Also write down every **spelling** the concept appears under. One removed concept is usually spelled several ways: `UPPER_SNAKE` enum value, `Title Case` label, `kebab-case` key, `camelCase` identifier — and prose copy can use different separators again (`Planned Mod`, `Planned - Mod`, `Planned-Mod`). A grep for one spelling misses the rest. Grep also can't find prose that paraphrases the concept without using the token, so read the user-facing copy in the diff too.

### 2. Grep each token repo-wide

```bash
# For each removed symbol AND each removed string key:
grep -rn "team-members" src/ --include="*.js" --include="*.jsx" | grep -v "\.test\."

# For a removed enum value / status / label, one case-insensitive pattern that
# tolerates the separator variants (zero separators too, so camelCase matches),
# across frontend, backend, and docs:
git grep -n -i -E "planned[ _-]*mod" -- . ':!*.lock' ':!*package-lock.json'
```

Exclude lockfiles by suffix or filename, not by a broad pattern. A pathspec with no wildcard (`':!package-lock.json'`) only matches at the repo root, so use the leading `*` (`':!*package-lock.json'`) to also skip nested copies. A broad pathspec like `':!*lock*'` hides unrelated files whose path merely contains "lock" (e.g. `procurement-shop-lock-parity`).

For every hit, classify it:

- **Producer gone, consumer remains** → the consumer is now dead or renders nothing. Fix or remove it.
- **Sibling data entry** (e.g. a label/i18n value for the key you deleted) → orphaned. Remove it.
- **Still live for another reason** (a different producer of the same key exists) → leave it, and note why.
- **Historical record** (audit/event history payloads that quote the old value) → leave it; history legitimately keeps what was true then. A typed column that shares a database enum with the removed value is different — it must be converted, or the enum change fails.

### 3. Trace the producer→consumer chain both directions

For a removed **producer** (e.g. a validation rule that emitted an error key), find who **consumed** its output:

```bash
# Who reads this key / renders this error / maps this label?
grep -rn 'getErrors("team-members")\|convertCodeForDisplay("validation"' src/
```

For a removed **consumer** (e.g. a component), find data that existed only to feed it — fixtures, selector maps, mock builders.

For a removed **stored value** (an enum member, status, or column), also check data at rest: existing rows may still hold the value, and removing it from code alone leaves them behind. Those rows need a data migration — see the `db-migrations` skill. Decide what they convert to; if the right replacement isn't obvious, that is a product question, so ask.

### 4. Run the static net and read the diff

```bash
bun run lint                    # frontend (from frontend/): unused import/var/param
pipenv run nox -s lint          # backend (from backend/ops_api): unused imports
git diff main                   # read every hunk: any comment, fixture field, or
                                # branch that referenced the removed thing?
```

Lint clearing is necessary, not sufficient. The `git diff` read is where you catch the data-level orphans by eye.

### 5. Confirm no test asserts the orphan

Before deleting an orphaned key/label, grep tests for it. If a test asserts its presence, that test is testing the dead thing — update or remove it in the same sweep.

## Quick Reference

| Orphan class | Caught by lint? | How to find |
|---|---|---|
| Unused import / var / param | ✅ Yes | `bun run lint` / `nox -s lint` |
| Object-map / label / i18n key | ❌ No | grep the string literal |
| String-keyed lookup (`errors[k]`, action type) | ❌ No | grep the string literal |
| Unreachable branch after caller removed | ❌ No | trace callers, read diff |
| Stale comment / JSDoc | ❌ No | read the diff |
| Fixture field for a deleted rule | ❌ No | grep field name in fixtures/tests |
| Enum value in `openapi.yml` / schema | ❌ No | grep every spelling of the value |
| User-facing copy naming the removed thing | ❌ No | grep every spelling, incl. separator variants |
| Existing rows holding a removed stored value | ❌ No | check data at rest; add a data migration |

## Common Mistakes

- **"Lint passed, so it's clean."** Lint only proves binding-level cleanliness. Data-level orphans (map keys, string lookups) pass lint. Grep the strings.
- **Only grepping symbol names.** The expensive orphans are keyed by **string literals**, not symbols. List and grep the strings too.
- **Grepping one spelling.** `PLANNED_MOD`, `Planned Mod`, and `Planned - Mod` are three different strings. Use a separator-tolerant, case-insensitive pattern (step 2).
- **Removing the code but not the data.** Deleting an enum member or status in code leaves rows that still hold it (and a database enum type that still lists it) until a migration converts them.
- **Only searching the file you edited.** Dependents live in other files — label maps in a `helpers/` module, fixtures in a test dir, renderers in a page component. Grep repo-wide.
- **Deleting an orphaned key that a test still asserts.** Sweep tests in the same pass, or you trade a dead key for a red build.
- **Leaving it "because it's out of scope."** If the deletion *created* the orphan, removing it *is* the scope. A one-line map-key deletion is zero-risk and completes the change.

## Real-World Impact

On OPS-5882 (removing the team-member Vest validation), ESLint and a first code review both passed. A second review caught an orphaned `"team-members": "Team Members"` entry in the `validation` label map in `src/helpers/utils.js` — dead the moment the Vest test that produced the `team-members` error key was deleted, because its only consumer was `convertCodeForDisplay("validation", key)` in `ReviewAgreement.jsx`. Grepping the removed **string key** repo-wide (step 2) would have surfaced it immediately.

On OPS-6356 (removing the `PLANNED_MOD` budget line status), the plan's grep was `planned_mod|planned mod|plannedmod`. It returned nothing for the frontend, but an Award approval page paragraph still read "...Planned Status to Planned - Mod Status." — the hyphenated spelling matched none of those patterns. Review caught it. The separator-tolerant pattern `planned[ _-]*mod` would have found it. The same removal also had to reach `openapi.yml`, API error messages, and the existing database rows, none of which lint covers.
