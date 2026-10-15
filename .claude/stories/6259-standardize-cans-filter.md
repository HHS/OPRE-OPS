# OPS-6259 — Standardize filter behavior on the CANs list

## Context

GitHub issue [#6259](https://github.com/HHS/OPRE-OPS/issues/6259) is one of six sub-issues of
[#5332](https://github.com/HHS/OPRE-OPS/issues/5332) "Standardize filter behavior across all list pages".
The epic makes filters, fiscal-year selection, and filter tags behave the same way on every list page.

Two rules from #5332 apply here:

- **Reset** clears all modal fields, does **not** fire a query, and leaves the page-level FY dropdown unchanged.
- **Apply** always commits the current modal state; an empty modal clears all active filters and tags, and
  results revert to the dropdown FY only.

The CANs list violates both today:

- `resetFilter` (`CANFilterButton.hooks.js:74-82`) writes straight to the parent `setFilters`, so Reset
  immediately refetches and wipes the tags while the modal is still open — the user can't back out.
- The modal has no controlled open state, so local buffers are never reseeded on reopen. Reset → close → reopen
  shows a stale cleared form.
- `applyFilter` (`:51`) gates the budget commit on `budget === fyBudgetRange` — **reference** equality. The slider
  allocates a new array on every drag (`CANFYBudgetRangeSlider.jsx:58`), so dragging both thumbs back to the ends
  leaves a stale full-range budget tag, and Reset-then-Apply can leave the budget filter behind.

**Scope is deliberately narrow.** #6259 states CANs has no Compare Fiscal Years component — FY stays
dropdown-only, no FY filter tags. So unlike the Agreements (#6256 / PR #6265, merged), BLI (#6258 / PR #6266,
merged) and Projects (#6257 / PR #6273, open) siblings, CANs does **not** adopt the shared
`src/helpers/fiscalYearFilter.helpers.js` Model B machinery, does not touch `getCans` in `opsAPI.js`, and needs no
backend change. This mirrors the much smaller Reporting change (#6260 / PR #6274, open) — the other page in the
epic with no Compare Fiscal Years component. Unlike Reporting, CANs is **not** UX-blocked: #6260 is held pending a
decision on adding an "All FYs" option, and CANs already has one (`CANFiscalYearSelect.jsx:12`,
`showAllOption = true`).

Decisions confirmed before planning:

1. Minimal scope as above — no shared-helper adoption, no Compare FYs combobox, no backend work.
2. CANs keeps its current-fiscal-year default (`getCurrentFiscalYear()`). Defaulting list pages to "All FYs" on
   load is issue #6140, which scopes itself to Projects and Agreements.
3. The FY Budget slider snaps back to the full range on Reset, and Apply compares it **by value** so an
   untouched / full-range slider clears the budget filter rather than committing a meaningless tag.
4. **Conflicting business rule, resolved:** #5332's Filter Tags section says "If all filters are cleared, tags
   disappear and dropdown reverts to 'All FYs'". That rule presupposes a Compare Fiscal Years selection to clear;
   CANs has no FY filter, so clearing filters cannot logically move the dropdown, and #6259's own bullet ("results
   revert to **dropdown FY** only") governs. **Reset and Apply never touch the FY dropdown on CANs.** Record this
   reasoning in the PR body and as a comment on #6259 so QA doesn't read #5332 literally and file a bug.

Branch: `OPS-6259/standardize-cans-filter`, cut from a **freshly fetched `origin/main`** (local `main` is behind;
#6266 merged after this planning started). Single PR.

---

## 1. `frontend/src/pages/cans/list/CANFilterButton/CANFilterButton.hooks.js`

### 1a. Add a module-level `isSameRange` helper (not exported)

Keep it local to this file — it's only meaningful against `fyBudgetRange`, and the shared
`fiscalYearFilter.helpers.js` module is out of scope.

```js
/**
 * Compares two numeric ranges by value. The slider allocates a NEW array on every drag
 * (CANFYBudgetRangeSlider.jsx:58), so the old reference check never matched after any drag —
 * dragging both thumbs back to the ends left a stale full-range budget tag.
 * Values are rounded because fyBudgetRange can be fractional (CanList.jsx:143-145 widens a
 * single-value range by ±10%) while the slider emits Math.round()-ed values (:46).
 * Non-finite values never compare equal, so a NaN range is never treated as "full range".
 */
const isSameRange = (a, b) =>
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((value, index) => Number.isFinite(value) && Number.isFinite(b[index]) && Math.round(value) === Math.round(b[index]));
```

The `Number.isFinite` guard matters: when `/cans-filters/` returns no `fy_budget_range`, `fyBudgetRange` is
`[0, 0]` (`CanList.jsx:141`), `calculatePercentage` divides by zero, and any drag yields `[NaN, NaN]`. Without the
guard, `Math.round(NaN) === Math.round(NaN)` is `false`, so §1e would commit `budget: [NaN, NaN]`, which passes
`opsAPI.js:830-835`'s `!== undefined && !== null` checks and sends `budget_min=NaN&budget_max=NaN`. Pre-existing
on `main`, but §1e rewrites this exact line.

Rounding tolerance is only load-bearing in the `min === max` case; for integer ranges it's a no-op.

### 1b. Add `showModal` as a 4th hook param

`useCANFilterButton(filters, setFilters, fyBudgetRange, showModal)`. Fix the existing JSDoc while there — it lists
params out of order and has `@param{` with no space.

Note `frontend/jsconfig.json` sets `"checkJs": true` and `"strict": true` over `src/**`, so JSDoc is
editor-checked (no CI gate, but reviewers see the squiggles). Two type fixes belong with this change:

- `CANFilterButton/CANFilterTypes.d.ts:11` — `budget?: [number, number]` is already violated on `main`
  (`CanList.jsx:36` and `CANFilterTags.hooks.js:128` both assign `[]`), and §1e makes `[]` the common path.
  Widen to `[number, number] | []`.
- `CANFilterTags/CANFilterTags.hooks.js:12` carries a duplicate `budget` typedef with the same defect — widen it
  the same way.

### 1c. Add a reseed-on-open effect, declared before the per-key sync effects

Mirrors the merged `AgreementsFilterButton.hooks.js:26-37`.

```js
    // Reseed all local buffers from parent filters when the modal opens. Reset no longer
    // writes to parent state, so without this a Reset-without-Apply would still be showing
    // on the next open.
    React.useEffect(() => {
        if (showModal) {
            setActivePeriod(filters.activePeriod ?? []);
            setTransfer(filters.transfer ?? []);
            setPortfolio(filters.portfolio ?? []);
            setCan(filters.can ?? []);
            // The slider destructures `const [minValue, maxValue] = budget`, so this buffer must
            // never be [] — "no budget filter" is represented by the full range.
            setBudget(
                Array.isArray(filters.budget) && filters.budget.length === 2
                    ? [filters.budget[0], filters.budget[1]]
                    : fyBudgetRange
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showModal]);
```

**Deps must be `[showModal]` only.** `filters` identity changes on tag removal, which would re-fire the reseed
while the modal is open and wipe the user's un-applied edits — including a Reset they just performed. (The
`[showModal, filters]` variant currently in `ProjectFilterButton.hooks.js` is being changed to `[showModal]` by
PR #6273 — reference the pattern, not that line.) Pin this with hook test 3 below.

`react-hooks/exhaustive-deps` is configured as `"warn"`, not `"error"` (`eslint.config.js:47`), so the
suppression comment is for reviewers, not the build.

### 1d. Normalize the four per-key sync effects and restructure the budget effect

**Normalize `null`.** The four existing effects (`:17-39`) are guarded as `if (filters.activePeriod)`. All four CAN
comboboxes are `ComboBox` wrappers with `isClearable`, and `ComboBox.hooks.js:137-140` fires
`setSelectedData(null)` on the clear control — so `applyFilter` can commit `activePeriod: null` into `filters`, the
guard no-ops, and the buffer is left holding `null`. `CANFilterTags.hooks.js:104` (`prevState.activePeriod.filter`)
is one state change away from throwing. All three merged siblings normalized this
(`AgreementsFilterButton.hooks.js:41-67`), and it's the exact class Copilot flagged on PR #6265. Change each to:

```js
    React.useEffect(() => {
        setActivePeriod(filters.activePeriod ?? []);
    }, [filters.activePeriod]);
```

…and correspondingly coalesce in `applyFilter` (§1e).

**Restructure the budget effect** (currently `:41-48`), which today calls `setBudget(fyBudgetRange)` and then
`setBudget(filters.budget)` in the same pass. Make the "no budget filter" case explicit — it's now the *common*
case, because `applyFilter` always writes the `budget` key, so every Apply produces a fresh `[]` and re-fires this
effect. That is what snaps the slider back to the full range after clearing.

```js
    // Sync the budget buffer when the applied budget filter changes (tag X clicked, or Apply
    // committed a value) or when the page-level FY changes the available range.
    React.useEffect(() => {
        if (Array.isArray(filters.budget) && filters.budget.length === 2) {
            setBudget([filters.budget[0], filters.budget[1]]);
        } else if (Array.isArray(fyBudgetRange)) {
            setBudget(fyBudgetRange);
        }
    }, [fyBudgetRange, filters.budget]);
```

This is behavior-neutral vs. `main` — both branches produce the value `main` ends up with — and the reseed effect
computes the same value for the same `filters`, so effect ordering between them cannot diverge.

### 1e. `applyFilter` — always commit, including budget

Collapse the two-branch version into one `setFilters` call:

```js
    const applyFilter = () => {
        // Always commit the current modal state, including budget: an empty modal must clear
        // every active filter and tag. A slider left at (or dragged back to) the full FY range
        // means "no budget filter" → write [] so the tag clears and budgetMin/budgetMax are
        // omitted from the query.
        setFilters((prevState) => ({
            ...prevState,
            activePeriod: activePeriod ?? [],
            transfer: transfer ?? [],
            portfolio: portfolio ?? [],
            can: can ?? [],
            budget: isSameRange(budget, fyBudgetRange) ? [] : budget
        }));
    };
```

### 1f. `resetFilter` — local buffers only

```js
    const resetFilter = () => {
        // Clear local buffers only — do NOT call setFilters here. Reset fires no query and leaves
        // the page-level FY dropdown untouched; the cleared state is committed on Apply.
        setActivePeriod([]);
        setTransfer([]);
        setPortfolio([]);
        setCan([]);
        // Not [] — the slider would render $ NaN. Full range == "no budget filter", which
        // applyFilter converts to [].
        setBudget(fyBudgetRange);
    };
```

Alternative considered and rejected: BLI's `null` sentinel (`BLIFilterButton.jsx:29/134/197`, `selectedRange={x ||
options}`). It reads more honestly but adds a third budget state without removing the full-range↔no-filter
coupling, which `isSameRange` needs anyway for the drag-back case. Instead, add a cheap render-site guard in §2 so
the `$ NaN` hazard can't come back.

## 2. `frontend/src/pages/cans/list/CANFilterButton/CANFilterButton.jsx`

Own the modal state and wire it both ways — this is the plumbing that makes §1c work. `FilterButton`
(`components/UI/FilterButton/FilterButton.jsx:21-29`) already accepts optional controlled `showModal` /
`setShowModal`; without them it falls back to internal state and reseeding silently never happens.

```jsx
    const [showModal, setShowModal] = React.useState(false);
    const { ... } = useCANFilterButton(filters, setFilters, fyBudgetRange, showModal);
    ...
        <CANFYBudgetRangeSlider
            budget={budget ?? fyBudgetRange}   // guard: the slider destructures and renders $ NaN on [] / null
            ...
        />
    ...
    return (
        <FilterButton
            applyFilter={applyFilter}
            resetFilter={resetFilter}
            fieldsetList={fieldsetList}
            showModal={showModal}
            setShowModal={setShowModal}
            disabled={disabled}
        />
    );
```

`FilterButton.handleApplyFilter` (`:31-34`) already closes the modal after Apply; `handleResetFilter` (`:36-38`)
deliberately does not — Reset leaves the modal open, which is the required behavior. `disabled` (`:54`) and both
close paths (X svg `:77`, `onRequestClose` `:66`) route through the resolved setter, so nothing else changes.
`TablePageLayout` renders `{FilterButton}` unconditionally, so the new `showModal` state survives FY changes and
refetches.

## 3. `frontend/src/pages/cans/list/CanList.jsx` — FY dropdown reflects the active FY

One-line fix at `:195-200`. Today `CANFiscalYearSelect` receives `fiscalYear` (numeric, or `undefined` when
"All") instead of `selectedFiscalYear`, so `<select value>` goes `2023 → undefined` and React warns about changing
a controlled input to uncontrolled. It works by accident only because the DOM retains the user's choice.

```jsx
                FYSelect={
                    <CANFiscalYearSelect
                        fiscalYear={selectedFiscalYear}
                        setSelectedFiscalYear={setSelectedFiscalYear}
                    />
                }
```

Also widen the JSDoc in `CANFiscalYearSelect/CANFiscalYearSelect.jsx:7` to `@param {number | string}`.

**Acknowledged visible side effect:** `FiscalYear.jsx:33` renders the "All" option **first** when
`fiscalYear === "All"`, and `:53` renders it **last** otherwise. Today branch `:33` is unreachable from CANs, so
"All" is always last. After this fix, selecting "All" moves that option to the top of the dropdown. This matches
what the Agreements and Projects lists already do (they pass their derived dropdown value), so it's a consistency
improvement, not a regression — but call it out in the PR body so QA isn't surprised. There's no duplicate option
(`:33` / `:53` are mutually exclusive, pinned by `FiscalYear.test.js:150-163`), and `<select value="2023">`
matches `<option value={2023}>` because React stringifies option values.

Do **not** change `CANTable fiscalYear={fiscalYear}` (`:168`) or
`CANSummaryCards fiscalYear={selectedFiscalYear === "All" ? "All FYs" : fiscalYear}` (`:211`) — those want the
numeric value. The other consumer of `CANFiscalYearSelect`, `pages/cans/detail/Can.jsx:72`, passes a numeric
`fiscalYear` with `showAllOption={false}` and is unaffected by both the prop change and the JSDoc widening.

## 4. Tests

### 4a. NEW `CANFilterButton/CANFilterButton.hooks.test.js` (6 tests)

Pure `renderHook`, modeled on `agreements/list/AgreementsFilterButton/AgreementsFilterButton.hooks.test.js`.
`const fyBudgetRange = [0, 1000]`.

**Critical harness detail:** RTL's `rerender(props)` **replaces** the prop object, it does not merge. The
Agreements reference gets away with `rerender({ showModal: true })` only because `filters` is closed over rather
than passed as a prop. Either close over `filters` and make `showModal` the only prop, or pass **both** keys on
every `rerender` — otherwise `filters` becomes `undefined` and the sync effects throw `TypeError`.

Seed `filters` non-empty for every test (all four lists populated plus `budget: [100, 500]`); with an all-empty
seed, several assertions below pass on `main` and guard nothing.

1. **Reseeds on open, and Reset fires no query.** Start `showModal: false`; `resetFilter()` → four buffers `[]`,
   `budget` equals `fyBudgetRange`, `expect(setFilters).not.toHaveBeenCalled()`; rerender with `showModal: true`
   → all buffers restored, `budget` back to `[100, 500]`. (Covers the old proposed test 4 — don't write it
   separately; it was a strict subset.)
2. **Does not reseed while open, after close, or when `filters` identity changes.** Start `showModal: true`,
   `setCan([])`, then rerender with `showModal: true` **and a brand-new `filters` object literal** → buffer stays
   `[]`; rerender with `showModal: false` → still `[]`. The new-identity leg is what actually pins the
   `[showModal]`-only deps decision; a stable object literal would behave identically under
   `[showModal, filters]` and prove nothing.
3. **`applyFilter` writes `budget: []` when the buffer equals the full range by value.** The stale-tag regression
   test. `act(() => result.current.setBudget([...fyBudgetRange]))` (new array, same values) then `applyFilter()`;
   assert through the updater, as the Agreements test does:
   `const updater = setFilters.mock.calls[0][0]; expect(updater(base).budget).toEqual([])`. Add a second case with
   `fyBudgetRange = [0.9, 110]` and buffer `[1, 110]` to pin the rounding tolerance, and a third with
   `[NaN, NaN]` to pin the `Number.isFinite` guard (must commit the NaN pair, not `[]` — i.e. never silently
   treated as full range).
4. **`applyFilter` commits a narrowed budget and all other buffers.** `setBudget([100, 500])` → `updater(base)`
   equals the full expected object including `budget: [100, 500]`.
5. **`applyFilter` coalesces a `null` buffer to `[]`.** `act(() => result.current.setActivePeriod(null))` then
   `applyFilter()` → `updater(base).activePeriod` is `[]`. Guards the §1d/§1e null normalization; fails on `main`.
6. **A cleared budget filter snaps the slider buffer back to the full range.** Rerender with
   `filters.budget: []` (modal open or closed) → `result.current.budget` equals `fyBudgetRange`. This is the
   `[100,500] → []` transition §1d exists for, and nothing else covers it.

Deliberately **not** written: a "reseed uses the full range when `filters.budget` is `[]`" test (the existing
budget effect already does that on mount, so it passes on `main`), and a per-key-sync test for behavior §1d
preserves rather than changes.

### 4b. NEW `CANFilterButton/CANFilterButton.test.jsx` (2 tests)

A `renderHook` test cannot catch the §2 plumbing failure — omitting `showModal` / `setShowModal` silently leaves
the modal uncontrolled and disables reseeding entirely. Copilot demanded exactly this test on PR #6266, so expect
a reviewer to ask for it. Follow `projects/list/ProjectFilterButton/ProjectFilterButton.test.jsx:111-127`: mock
`react-modal` **including `Modal.setAppElement = vi.fn()`**. (`src/tests/setupTests.jsx:63-68` already appends a
`#root` div and `:76-83` already stubs `ResizeObserver`, so the real `Modal.setAppElement("#root")` would not
actually throw and the `ResizeObserver` stub from the Projects file is redundant — mock `react-modal` for
simplicity of asserting open/closed, not out of necessity.) The real `CANFYBudgetRangeSlider` / `DoubleRangeSlider`
render fine in jsdom, and no Provider or store is needed — all four comboboxes are prop-driven `ComboBox` wrappers.

Seed `filters` with all four lists populated plus `budget: [100, 500]`.

1. **Reset does not call `setFilters`, the modal stays open, and the fields visibly clear.** Assert Apply is still
   rendered, `setFilters` not called, and the slider caption is back at the full range. Caption assertion must use
   separate matchers or `toHaveTextContent` on the wrapping `div.font-12px` — `CANFYBudgetRangeSlider.jsx:92-102`
   splits the caption into three sibling nodes, so `getByText("$ 0 to $ 1,000")` matches nothing. Copy the pattern
   from the existing `CANFYBudgetRangeSlider.test.jsx:27-29`.
2. **Reset → close → reopen reseeds from the still-active parent filters.** Must assert the *cleared intermediate
   state* before reopening (caption at full range, selections gone), then reopen and assert the narrowed caption
   and selections are back. Without the intermediate assertion this test passes on `main`: `main`'s `resetFilter`
   only calls `setFilters`, and with a `vi.fn()` parent the local buffers are never cleared, so "the values are
   back" is trivially true. Close via `container.querySelector("#filter-close")` — `FilterButton.jsx:75-81` is a
   bare `<svg id="filter-close">` with no role or accessible name, so no RTL query will find it.

### 4c. CHANGE `CanList.test.jsx`

Both edits are tied to §3. Update the `CANFiscalYearSelect` mock (`:41-52`) to (a) wrap the `<select>` and a new
`<span data-testid="can-fiscal-year-value">{String(fiscalYear)}</span>` in a fragment, and (b) stop emitting a
duplicate `"All"` option once `fiscalYear === "All"`. Then in the third test (`:123-165`), after
`selectOptions(..., "All")`, add:

```js
await waitFor(() => expect(screen.getByTestId("can-fiscal-year-value")).toHaveTextContent("All"));
```

This fails on `main` (the prop is `undefined` → renders `"undefined"`) and passes after the fix. Asserting
`toHaveValue("All")` on the select would *not* pin it — with `value={undefined}` the mock select goes uncontrolled
and keeps the DOM selection. No other assertions change; `CANFilterButton` is mocked at `:33-35`, so the hook
changes are invisible here.

### 4d. CHANGE `frontend/cypress/e2e/canList.cy.js`

`beforeEach` (`:19-26`) needs no change — Reset now clears the buffers and the following Apply commits them, so
the FY-2023-only baseline is unchanged. No other spec depends on CAN Reset firing a query (only `:24` and `:208`
touch it), and the merged siblings already use Reset→Apply (`agreementList.cy.js:106-108`,
`budgetLineItemsList.cy.js:136-138`).

Replace `:206-216` in "the filter button works as expected", which currently asserts Reset alone clears the tags
and will fail:

```js
        // Reset clears the modal fields but must NOT fire a query — tags stay until Apply
        cy.get("button").contains("Filter").click();
        cy.get("button").contains("Reset").click();
        cy.get("div").contains("Filters Applied:").should("exist");
        cy.get("button[id='filter-tag-activePeriod-0']").should("exist");
        cy.get("button[id='filter-tag-budget-4']").should("exist");
        // Reset leaves the page-level FY dropdown untouched
        cy.get("#fiscal-year-select").should("have.value", "2023");

        // Apply commits the emptied modal — every tag clears, results revert to FY 2023
        cy.get("button").contains("Apply").click();
        cy.get("div").contains("Filters Applied:").should("not.exist");
        cy.get("button[id='filter-tag-activePeriod-0']").should("not.exist");
        cy.get("button[id='filter-tag-portfolio-1']").should("not.exist");
        cy.get("button[id='filter-tag-transfer-2']").should("not.exist");
        cy.get("button[id='filter-tag-can-3']").should("not.exist");
        cy.get("button[id='filter-tag-budget-4']").should("not.exist");

        cy.get("tbody").find("tr").should("have.length.greaterThan", 3);

        // Dropdown-only FY changes never produce a tag (#5332 Filter Tags rule)
        cy.get("#fiscal-year-select").select("2021");
        cy.get("div").contains("Filters Applied:").should("not.exist");
```

The `filter-tag-{key}-{index}` suffixes stay valid: `FilterTags.jsx:53-62` indexes the flattened list,
`CANFilterTags.jsx:17-18`'s `groupBy` preserves first-appearance key order, and the new `applyFilter` changes all
five keys in one commit, so the order is identical to today (already pinned by `:191-195`).

Use `should("exist")`, not `be.visible`, for tags asserted while the modal is open. Don't E2E the "drag back to
full range clears the tag" case — the three `it.skip` slider tests at `:220-282` show those drags are unreliable
in CI, and hook test 3 covers it. Tests at `:284` and `:305` are unaffected (they only Apply).

### 4e. Amend a stale in-repo comment

`frontend/src/helpers/fiscalYearFilter.helpers.js:5` says "Projects, **CANs**, Reporting will adopt these in
follow-up PRs", and `:77-80` says "the getCans query builder … must be updated to use getFiscalYearQueryValue()
before the CAN page adopts this helper". Record the opt-out in both places (one line: CANs has no Compare Fiscal
Years component per #6259 and intentionally does not adopt these), otherwise a reviewer will block on the
contradiction.

## 5. Traps and edge cases

1. **`setBudget([])` is fatal.** `CANFYBudgetRangeSlider.jsx:25` destructures, then `calculatePercentage` on
   `undefined` → `sliderValue = [NaN, NaN]` and the caption renders `$ NaN to $ NaN`. Reset and reseed must both
   use `fyBudgetRange`; §2's `budget ?? fyBudgetRange` render guard is the backstop.
2. **Removing the budget tag while the modal is open** discards an un-applied slider drag (the sync effect snaps
   to the full range). That's the correct reading of "the budget filter was removed", but worth knowing if QA
   reports it.
3. **Apply now always writes the `budget` key**, so `filters` gets a new identity on every Apply.
   `CanList.jsx:98-100` resets to page 1 (already true for any filter change on `main`), and RTK Query keys on
   serialized args, not identity — a fresh `[]` serializes identically, so Apply on an already-empty modal is
   idempotent from the network's perspective.
4. **Changing the FY dropdown while the modal is open** changes `fyBudgetRange` (`CanList.jsx:140-147`), and
   `portfolioOptions` / `canOptions` change under the existing selections. Note the budget branch order: with a
   budget filter applied, the buffer keeps the old absolute dollars, which can fall outside the new range and push
   the thumbs past the ends. Identical to `main`'s behavior — not a regression, and deliberately not "fixed" here
   (the reseed effect must not re-fire on FY change) — but do not describe it as "snaps to the new range."
5. **`disabled={!filterOptionsData}`** can disable the Filters toggle mid-flight after an FY change while the
   modal is open. Pre-existing; the X and overlay still close it.
6. **Tags and the FY select stay clickable while the modal is open.** `FilterButton.jsx:69` supplies
   `overlayClassName`, so react-modal omits its default full-viewport overlay styles and
   `FilterButton.module.css .filterOverlay` sets only a background colour, with `parentSelector` scoping it to
   `#filter-container`. That's what makes manual step 16 performable.
7. **Do not add any FY handling** to `CANFilterTags.hooks.js` — no FY tags on this page, and `removeFilter`
   (`:99-134`) needs no new case.
8. **Explicit non-goal:** `CanList.jsx:205` passes a `fyBudgetRange` prop that `CANFilterTags.jsx:14` doesn't
   accept. Real but unrelated dead code — leave it, to keep this diff on-topic.

## 6. Verification

**Unit**

1. `cd frontend && bun run test --watch=false CANFilterButton` — new hook + component tests green.
2. Mutation check (each should fail, then restore):
   - revert §1e's `isSameRange` to `budget === fyBudgetRange` → hook test 3 fails;
   - revert §1f's `setBudget(fyBudgetRange)` to `setBudget([])` → hook test 1 fails;
   - drop the `?? []` coalescing from §1e → hook test 5 fails;
   - drop `showModal` / `setShowModal` from §2's `FilterButton` → component test 2 fails;
   - widen §1c's deps to `[showModal, filters]` → hook test 2 fails.
3. `bun run test --watch=false CanList` — the new FY-prop assertion must fail before the §3 one-liner and pass
   after.
4. `bun run test --watch=false` — **full suite**, since §3 changes a prop and §4c rewrites a shared mock.
5. `bun run test:coverage --watch=false` — informational only. `CANFilterButton.hooks.js` and
   `CANFilterButton.jsx` go from 0 % (they're mocked away in `CanList.test.jsx`) to covered. Note that despite the
   "90 % required" line in `frontend/CLAUDE.md`, `vite.config.mjs:113-127` defines no coverage `thresholds` and
   CI runs `bun run test` without `--coverage`, so no gate actually blocks the PR.
6. `bun run format && bun run lint --fix`.

**E2E**

7. `podman compose up -d` (wait for backend + seeded DB), then `bun run test:e2e --spec cypress/e2e/canList.cy.js`.
   "the filter button works as expected" passes with the new Reset/Apply split, and the `beforeEach`
   Filter → Reset → Apply still yields 10 rows in "loads".
8. Confirm the `afterEach` axe check still passes — no DOM structure changed.

**Manual** (`podman compose up`, http://localhost:3000/cans, login as `division-director`)

9. FY 2023 → Filters → pick an active period, transfer, portfolio, CAN, drag both slider thumbs → Apply.
   Five tags; modal closed.
10. Filters → Reset. Expect every field cleared, slider back to the full range with the full `$min to $max`
    caption, **tags and table unchanged**, no request in the Network tab, FY dropdown still 2023, modal still open.
11. Close with the X, reopen. Expect all five previous selections and the narrowed slider back (the reseed).
12. Filters → Reset → Apply. All tags gone, table = all FY 2023 CANs, FY dropdown still 2023 (per decision 4).
13. Bug-fix check: Filters → drag one thumb in, then drag both thumbs fully back to the ends → Apply. Expect
    **no** budget tag (on `main` you get a stale full-range tag).
14. Apply an empty modal twice in a row — no error, no duplicate query.
15. Clear a combobox with its X control inside the modal, then Apply — no crash, tag gone (the `null` path).
16. Switch FY to All → 2021 → All. The dropdown always displays the selection, the "All" option sits at the top
    while selected, and the console is free of the "changing a controlled input to be uncontrolled" warning.
17. With filters applied, click a single tag's X while the modal is open — that field clears inside the modal and
    the results update.

## 7. PR

Conventional commit, single line, < 100 chars:
`fix: standardize CANs list filter Reset/Apply and clear stale budget tag`

Per `CLAUDE.md`, commit messages carry **no trailers** — that project rule takes precedence over the harness's
attribution reminder, so no `Co-Authored-By` line. The PR description may keep the
`🤖 Generated with Claude Code` footer.

PR body: link parent story #5332 and sub-issue #6259; cite merged Agreements #6265 / BLI #6266 and companion
Reporting #6274 as pattern references; state decision 4 (why the dropdown does not revert to "All FYs" on clear)
and the §3 "All"-option reordering; fill the template's DoD / a11y / Storybook checkboxes as the siblings did.
**No** `Closes #NNNN` — the team's QA process requires the story to stay open past merge. Also post decision 4 as
a comment on #6259 for team confirmation.
