# Refactor plan: extract pure helpers from CreateBLIsAndSCs.hooks.js

## Why
Move every function in the hook that's fully described by "given these inputs, return this output" — no `useState`, `dispatch`, or `setAlert` involved — into a sibling `CreateBLIsAndSCs.helpers.js`. None of these touch React state, so extracting them doesn't change the hook's behavior or public API, it just shrinks the file and makes that logic unit-testable as plain function calls. This also matches how the codebase already separates pure logic into `.helpers.js` files elsewhere (`agreement.helpers.js`, `budgetLines.helpers.js`).

## Estimated impact
~300 lines removed (~1,432 → ~1,130 lines, about a 22% reduction).

## Steps
1. Create `CreateBLIsAndSCs.helpers.js`
2. Move `isDeletionRoutedToApproval` and `getBudgetLinesUrl` into it as-is
3. Move `addServiceComponentIdToBLI` and `addGrantNumberIdToBLI` into it as-is
4. Move `createBudgetChangeMessages`'s body into a pure `buildBudgetChangeMessages(tempBudgetLines, cans)`, wrapped in a thin `useCallback` back in the hook
5. Extract the new-agreement payload-shaping block from `handleSave` into `buildNewAgreementBudgetPayload({...})`
6. Extract the existing-agreement link-resolution glue from `handleSave` into `linkBudgetLinesToApi({...})`
7. Extract the object-construction half of `handleAddBLI` into `buildNewBudgetLineItem({...})`
8. Extract the object-construction half of `handleEditBLI` into `buildEditedBudgetLinePayload({...})` — biggest single win at ~85 lines
9. Extract the object-construction half of `handleDuplicateBudgetLine` into `buildDuplicatedBudgetLineItem({...})`
10. Update imports in `CreateBLIsAndSCs.hooks.js` to pull all of the above from `./CreateBLIsAndSCs.helpers`

## Phase 2: further extraction from CreateBLIsAndSCs.hooks.js (post-Phase-1)

### Why
Phase 1 got the hook from ~1,432 to ~1,100 lines. A second pass over the result found one spot of
actual repeated logic (not just relocatable logic) plus several more pure computations still living
inline in the hook body. Extracting these continues the same pattern as Phase 1 — pure, unit-testable
functions move to `.helpers.js`; anything stateful/effectful that's a self-contained subsystem (the
unsaved-changes navigation blocker) moves to its own hook.

### Estimated impact
~150-200 more lines out of `CreateBLIsAndSCs.hooks.js` (~1,100 → ~900-950 lines), and removal of a
6x-repeated destructure.

### Steps
1. Add `stripFormOnlyFields(entity)` to `CreateBLIsAndSCs.helpers.js` — a single helper for the
   `const { display_title, has_changed, popStartDate, popEndDate, mode, ...clean } = entity` pattern
   that's currently copy-pasted 4x in `handleSave` (SC create, SC update, GN create, GN update) and
   2x in `buildNewAgreementBudgetPayload`. Replace all 6 call sites.
2. Extract the "which SCs/grant numbers are new vs. changed" filtering in `handleSave` (currently
   duplicated once for SCs, once for grant numbers) into `partitionNewAndChanged(items)`, returning
   `{ newItems, changedItems }`.
3. Move `feesForCards`, `subTotalForCards`, and `totalsForCards` into `CreateBLIsAndSCs.helpers.js`
   as-is — they're pure functions of a `budgetLines` array with no closure over hook state.
4. Extract the `budgetLinesWithScPeriod` memo body into a pure `attachScPeriodToBudgetLines(tempBudgetLines, servicesComponents)`, keeping the `React.useMemo` wrapper in the hook.
5. Extract the `effectiveScStartDate`/`effectiveScEndDate` memo bodies into a pure
   `getEffectiveScDateRange(servicesComponents)` returning `{ start, end }`.
6. Extract the page-error-filtering block (the `res`/`pageErrors`/`unassociatedGroup`/
   `unassociatedBliIds`/`bliIdFromErrorKey`/`budgetLineErrors` chain tied to issue #6094) into a pure
   `computeBudgetLinePageErrors({ pageErrors, isGrant, groupedByGrantNumber, groupedByServicesComponent, isReviewMode })`.
7. Extract the unsaved-changes navigation blocker subsystem — `handleSaveRef`, `blockerRef`,
   `proceedIfBlocked`, and the `blocker.state === "blocked"` effect that builds the save-changes
   modal — into a new `useUnsavedChangesBlocker.js` hook. This is the one non-pure extraction in this
   phase; it's a self-contained subsystem with a narrow interface (`blocker`, `handleSave`,
   `requiresFinancialApproval`, `setIsEditMode`, `navigate`) and becomes independently testable.
8. Update imports in `CreateBLIsAndSCs.hooks.js` for the new helpers and the new hook.

## Phase 3: reduce Contract/Grant duplication outside this file

### Why
`CreateBLIsAndSCs.hooks.js`/`.helpers.js` already unify the Contract (Services Component) and Grant
(Grant Number) paths behind one `isGrant` branch. A survey of the surrounding create/edit workflow
found the same "same shape, different field name" duplication has NOT been unified in three sibling
places, plus one real 1:1 duplicate block. Unlike Phase 1/2, some of the divergence here is
intentional (SC has a PoP-conflict validation rule Grant doesn't), so this phase is scoped to the
parts that are safe to unify without flattening real behavioral differences.

### Estimated impact
~60-95 lines removed across `AgreementEditorContext.hooks.js` and the two form components, with no
behavior change. The larger `ServicesComponents.hooks.js`/`GrantNumbers.hooks.js` unification is
called out as a stretch goal, not committed impact, since it's a bigger lift for a real (not
incidental) divergence.

### Steps
1. In `AgreementEditorContext.hooks.js`, replace the parallel `ADD/UPDATE/DELETE_SERVICES_COMPONENT`
   and `ADD/UPDATE/DELETE_GRANT_NUMBER` reducer cases (~60 structurally-identical lines) with small
   factories — `makeAddCase(stateKey)`, `makeUpdateCase(stateKey)`, and
   `makeDeleteCase({ stateKey, deletedIdsKey, linkField, clearFn })` — parameterized by the state key
   and BLI-link field that differ between the two. Leave `CLEAR_SERVICES_COMPONENTS` alone; it has no
   grant analog.
2. Extract the copy-paste-identical `DateRangePickerWrapper` + two `DatePicker`s block from
   `ServicesComponentForm.jsx` and `GrantNumberForm.jsx` (~35 duplicate lines) into a shared
   `<PeriodOfPerformanceFields idPrefix ... />` component. Leave the rest of each form as-is — the
   SC-only checkbox and validation-suite wiring are real per-type differences, not duplication.
3. (Stretch, optional) Evaluate extracting a shared `usePeriodEntityEditor` base hook for the
   ~100-120 lines of parallel state/handler scaffolding in `ServicesComponents.hooks.js` and
   `GrantNumbers.hooks.js` (formData/showModal/modalProps/formKey state, submit/delete/cancel
   handlers), with SC layering its extra PoP-conflict validation suite on top. Only pursue this if
   Steps 1-2 land cleanly first — the payoff is real but this is the riskiest item since it touches
   two hooks with genuinely different validation behavior.
4. Do not touch the `ServicesComponentSelect`/`GrantNumberSelect` or
   `AllServicesComponentSelect`/`AllGrantNumberSelect` pairs — they're already thin, stable wrappers;
   a generic parameterized version would add indirection for minimal line savings.

## Phase 4: shrink `handleSave` and its immediate neighbors

### Why
Phases 1-3 extracted pure, relocatable logic out of the hook. A pass focused specifically on
`handleSave` (still the longest function in the file) found one real repeated block inside it, one
pair of near-duplicate sibling functions, and one more pure computation that fits the Phase 1/2
pattern. Scoped to changes that don't alter the `finally`/cleanup ordering or the modal/blocker
error-handling shapes, since those are the parts most likely to silently regress.

### Estimated impact
~60-80 lines out of `CreateBLIsAndSCs.hooks.js`, plus a materially shorter `handleSave` dependency
array (currently 18 entries).

### Steps
1. Add a `persistPartitionedEntities(items, addMutation, updateMutation)` async helper in the hook
   file (NOT `.helpers.js` — it awaits the injected RTK mutation trigger functions, so it isn't pure).
   It wraps `partitionNewAndChanged` + create-promises + update-promises + the two `Promise.all`
   calls. Replace the two structurally-identical call sites in `handleSave` (services components,
   grant numbers) with `await persistPartitionedEntities(servicesComponents, addServicesComponent, updateServicesComponent)`
   and the grant-number equivalent.
2. Unify `handleFinancialSnapshotChanges` and `handleFinancialSnapshotChangesViaBlocker`. These are
   ~90% identical but differ in error-handling shape: the "ViaBlocker" version is a plain `async`
   function that throws on failure (caught by `handleSave`'s own `try/catch`), while the modal version
   wraps everything in `new Promise((resolve, reject) => ...)` and rejects instead of throwing, plus
   has a `handleSecondary` escape hatch with no analog in the other function. Do NOT try to merge the
   promise-wrapping/modal logic — only extract the throwing core (essentially
   `handleFinancialSnapshotChangesViaBlocker`'s body as-is) into a shared
   `sendExistingBLIsToApproval(existingBudgetLineItemsWithIds, redirectUrl)` that always throws on
   failure. Then:
   - `handleFinancialSnapshotChangesViaBlocker` becomes a thin wrapper calling it with
     `blocker.location?.pathname`.
   - `handleFinancialSnapshotChanges`'s `handleConfirm` becomes
     `try { await sendExistingBLIsToApproval(existingBudgetLineItemsWithIds, getBudgetLinesUrl(selectedAgreement?.id)); resolve(); } catch (e) { reject(e); }`,
     leaving the modal setup, `handleSecondary`, and the outer `new Promise` untouched.
3. Extract `showSuccessMessage`'s alert-content derivation (the `anyChangeSentToApproval` /
   `pendingChanges` / heading+message branching) into a pure
   `buildSaveSuccessAlert({ tempBudgetLines, deletedBudgetLines, budgetLines, canEditDirectly, isSuperUser, cans, selectedAgreement, savedViaModal, blockerLocationPathname, isThereAnyBLIsFinancialSnapshotChanged })`
   in `.helpers.js`, returning the `setAlert(...)` payload. `showSuccessMessage` keeps the
   `continueOverRide` early-return (that's a control-flow branch, not alert content) and otherwise
   just calls `setAlert(buildSaveSuccessAlert({...}))`.
4. Split `handleSave`'s `if (!agreement.id) { ... } else { ... }` branches into
   `handleSaveNewAgreement` and `handleSaveExistingAgreementBudget` callbacks, with `handleSave`
   calling one or the other. Keep the shared tail (`suite.reset()`/`budgetFormSuite.reset()`/
   `datePickerSuite.reset()`/`resetForm()`/`setIsEditMode(false)`/`showSuccessMessage(...)` and the
   outer `try/catch/finally`) in `handleSave` itself — do NOT duplicate that cleanup into each split
   function, since keeping it shared is what makes this split safe.
5. (Separate, call out explicitly — this is a behavior change, not a pure refactor) Add a
   `resetValidationSuites()` helper for the `suite.reset(); budgetFormSuite.reset();
   datePickerSuite.reset();` sequence copy-pasted in `resetForm` and at the end of `handleSave`.
   Note: the mount/unmount effect (issue #5894) also resets `scFormSuite`, which `resetForm`/
   `handleSave` currently do NOT. Decide explicitly whether `resetValidationSuites()` should include
   `scFormSuite` (fixing a likely-latent inconsistency) or intentionally omit it — don't let this
   fold in silently as a side effect of the dedup.
6. (Deprioritized/stretch — do not bundle with the above) Wrap `handleAddBLI`, `handleEditBLI`,
   `handleDeleteBudgetLine`, `handleDuplicateBudgetLine`, `handleCancel`, and `handleGoBack` in
   `useCallback` for consistency with the first 7 numbered handlers in the file. Real payoff (fewer
   child re-renders) but diffuse, and getting 6 dependency arrays right without introducing stale
   closures needs its own careful pass — only do this if already touching those functions for another
   reason.
