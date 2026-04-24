# OPS-5525 — Storybook Phase 1: DataViz Primitive Stories

**GitHub issue:** [#5525](https://github.com/HHS/OPRE-OPS/issues/5525)
**Parent:** #1224 · **Depends on:** #5524 (Phase 0 — Storybook setup, ✅ complete)
**Branch:** `ops-5525/storybook-phase-1`

---

## Goal

Add Storybook stories for all DataViz primitives and their Card wrappers so the UX
team can review them in isolation, and so future component work has living
documentation of props, edge cases, and accessibility states.

## Success criteria

- A story file is co-located next to every component listed below.
- Each story file covers at least: a realistic **Default**, one or more **edge
  cases** (zero, overflow, single value, over-budget), and renders cleanly in the
  `addon-a11y` panel.
- `bun run storybook` shows all 10 components under the correct sidebar
  hierarchy (`UI/DataViz/*`, `UI/Cards/*`).
- `bun run build-storybook` succeeds (required for dev/stg deploy).
- `bun run lint` and `bun run format` pass on the new files.
- A demo-ready Storybook instance is available to walk through with the UX team.

## Non-goals

- Feature/domain components (anything outside `UI/DataViz/` or `UI/Cards/`) —
  those land in a later phase.
- Visual regression testing (Chromatic) — out of scope for Phase 1.
- Redesigning or refactoring any component behavior — stories only.

---

## Conventions (recap)

Already documented in [`frontend/.storybook/README.md`](../../../frontend/.storybook/README.md)
and our AGENTS.md; the highlights that apply here:

- File: `ComponentName.stories.jsx`, co-located with the component.
- Title prefix: `UI/DataViz/<Component>` or `UI/Cards/<Component>`.
- Global decorators already wrap every story in Redux `Provider` + `MemoryRouter`.
  Seed state via `parameters.store.preloadedState`; seed route via
  `parameters.reactRouter.initialEntries`.
- Use **realistic currency values** that match real app data shapes — no
  `foo`/`bar`/`123`.
- All percentage displays must flow through the shared helpers in
  `frontend/src/helpers/utils.js` (`computeDisplayPercent`,
  `computeDisplayPercents`, `applyMinimumArcValue`) — see AGENTS.md "Data-Visualization Percentage Display Convention".
- `*.stories.jsx` is excluded from the 90% Vitest coverage gate.

---

## Gotchas discovered during implementation

- **Stories should be visually distinct.** If two stories look identical in the
  Storybook canvas, drop one. Subtle implementation differences (e.g. 1 array
  item vs. 4 items with 3 zeros) belong in unit tests, not in Storybook where
  a UX reviewer would see two indistinguishable charts.

- **Full-width cards: CSS module width overrides USWDS `width-full` in Storybook.**
  `RoundedBox`'s CSS module sets `width: 29.125rem` (466px). In Storybook's
  Vite dev mode, CSS modules are injected after global styles so `.container`
  wins over `.width-full { width: 100% }` by cascade order — even though the
  component passes `className="width-full"`. The real app is unaffected because
  its build/layout context differs. Fix in stories: set `parameters.layout:
  "fullscreen"` and inject a targeted `<style>` override using the element's
  hardcoded `id` or `data-cy` attribute:
  ```jsx
  <style>{"#big-budget-summary-card { width: 100% !important; }"}</style>
  ```
### `ResponsiveDonutWithInnerPercent` (and any nivo-based component)

- **Stateful wrapper required.** `setPercent`/`setHoverId` drive the center
  label and legend highlight state. Storybook `args` can't own React state, so
  each story uses a local render wrapper. Only capture the setter when the
  consumer value (`hoverId`) isn't needed: `const setHoverId = useState(-1)[1]`.
- **Container `id` pairing.** The component's `MutationObserver` searches for
  `#${container_id}` to find the nivo SVG and apply `aria-label`. The wrapping
  `<div>` must have `id={container_id}`. Give each story a unique `containerId`
  to avoid conflicts when Storybook renders multiple stories.
- **Storybook Controls for complex data shapes.** When a component takes an
  array of objects (e.g. slice data), don't expose the raw array as an `object`
  control (JSON editor — awkward for UX demos). Instead flatten the array into
  individual named args (`draftAmount`, `plannedColor`, etc.) and rebuild the
  array inside the render wrapper. Group related controls with
  `table: { category: "..." }` in `argTypes` so the Controls panel stays
  organised.
- **All stories must use the same render function shape** to inherit `argTypes`
  controls reliably. Story-level `argTypes` overrides (e.g. `table: { disable: true }`)
  can break control inheritance for sibling stories and cause Storybook to fall
  back to a "Set object" raw JSON editor. Prefer setting edge-case arg values to
  `0` / sensible defaults rather than hiding controls per-story.
- **Named display name required for render factory functions.** An arrow function
  returned from a factory (e.g. `const renderFoo = (id) => (args) => <Foo />`) has
  no inferable display name and fails the `react/display-name` ESLint rule. Fix:
  name the inner function and set `.displayName` explicitly:
  ```js
  const renderFoo = (id) => {
      const Render = (args) => <Foo {...args} id={id} />;
      Render.displayName = "FooStory";
      return Render;
  };
  ```

---

## Plan / checklist

Each item below is a single story file. Check off as we land each one.

### DataViz primitives (pure/presentational — no Redux, no API)

- [ ] **HorizontalStackedBar** — `UI/DataViz/HorizontalStackedBar/HorizontalStackedBar.stories.jsx`
  - Stories: Default (5 portfolios), TinySegment, SingleSegment, AllZero, KeyboardNav
  - 📝 Widths derived from `value`, never from `percent` string. Zero-value segments filtered out. Returns `null` when all filtered.
  - ⏳ Awaiting manual verification.
- [ ] **LineGraph** — `UI/DataViz/LineGraph/LineGraph.stories.jsx`
  - Stories: Default, InProgress (striped), ZeroLeft, ZeroRight
  - 📝 Always 2 data items. `isStriped` + `overBudget` boolean controls exposed.
  - ⏳ Awaiting manual verification.
- [ ] **ReverseLineGraph** — `UI/DataViz/LineGraph/ReverseLineGraph.stories.jsx`
  - Stories: Default, ZeroReceived, OverReceived
  - 📝 Left bar hidden when `leftValue === 0`. Right bar always striped.
  - ⏳ Awaiting manual verification.
- [ ] **LineBar** — `UI/DataViz/LineBar/LineBar.stories.jsx`
  - Stories: Default, ZeroValue (shows TBD), ZeroValueNotFirstRow (shows $0), MaxValue
  - 📝 `ratio` exposed as a range slider (0–1). TBD fallback when `total===0 && iterator===0`.
  - ⏳ Awaiting manual verification.
- [x] **ResponsiveDonutWithInnerPercent** — `UI/DataViz/ResponsiveDonutWithInnerPercent/ResponsiveDonutWithInnerPercent.stories.jsx`
  - Stories: Default (multi-slice), AllOneCategory, TinySlice, AccessibilityLabeling
  - ❌ `SingleSlice` dropped — visually identical to `AllOneCategory` from a UX
    perspective. The subtle implementation difference (1 item in the array vs. 4
    items with 3 zeros) is covered by unit tests, not Storybook.
  - ⚠️ Wraps `@nivo/pie`'s `ResponsivePie` + uses a `MutationObserver` for async
    SVG a11y labeling. Verify it works inside the Storybook iframe.
  - 📝 **Gotcha:** `setPercent`/`setHoverId` require React state — can't be driven
    by Storybook `args` alone. Each story uses a `DonutWrapper` render function
    that owns state and provides the container `<div id={containerId}>` that the
    `MutationObserver` searches for. `hoverId` (legend highlight) is not needed
    in a bare-chart story so only the setter is kept (`useState(-1)[1]`).
  - 📝 **Gotcha:** `computeDisplayPercents` must be called on raw data inside the
    wrapper before passing to the component — same pattern as `BLIStatusSummaryCard`.
  - ✅ Verified in `bun run storybook` — all stories render, controls live, Docs tab confirmed.

### Card composites (may read from Redux / React Router)

- [ ] **LineGraphWithLegendCard** — `UI/Cards/LineGraphWithLegendCard/LineGraphWithLegendCard.stories.jsx`
  - Stories: Default (CAN carry-forward vs new funding), EqualSplit, ZeroBudget
  - 📝 `LineGraph` always expects exactly 2 data items — destructures `data[0]` and
    `data[1]` directly. Bar is hidden when `bigNumber === 0`.
  - 📝 No wrapper state needed — card manages `activeId` internally.
  - ✅ Verified in `bun run storybook` — all stories render, controls live, hover bolding confirmed.
- [ ] **DonutGraphWithLegendCard** — `UI/Cards/DonutGraphWithLegendCard/DonutGraphWithLegendCard.stories.jsx`
  - Stories: Default (BLI status breakdown), AllOneCategory, TinySlice
  - 📝 No wrapper state needed — card manages hover state + `container_id` internally.
    Render factory pre-computes percents via `computeDisplayPercents` before
    passing `data` to the card.
  - ✅ Verified in `bun run storybook` — all stories render, controls live, legend hover confirmed.
- [x] **BudgetCard** — `UI/Cards/BudgetCard/BudgetCard.stories.jsx`
  - Stories: Default, OverBudget, ZeroBudget
  - 📝 Pure/presentational — builds `graphData` internally from `totalSpending` +
    `totalFunding`. No wrapper state needed.
  - ✅ Verified in `bun run storybook` — all stories render, controls live.
- [x] **BigBudgetCard** — `UI/Cards/BudgetCard/BigBudgetCard.stories.jsx`
  - Stories: Default, OverBudget, ZeroBudget
  - 📝 Same shape as `BudgetCard` but portfolio-level layout with footnote.
  - 📝 CSS module `width: 29.125rem` overrides USWDS `width-full` in Storybook — fixed
    with `layout: "fullscreen"` + targeted `<style>` injection. See Gotchas.
  - ✅ Verified in `bun run storybook` — full-width layout confirmed.
- [x] **ReceivedFundingCard** — `UI/Cards/BudgetCard/ReceivedFundingCard.stories.jsx`
  - Stories: Default, OverReceived, ZeroFunding
  - 📝 Uses `ReverseLineGraph` instead of `LineGraph`. Bar hidden when `totalFunding === 0`.
  - ✅ Verified in `bun run storybook` — bar direction and zero state confirmed.

### Wrap-up tasks

- [ ] Manually verify all 10 components render with USWDS styles in
  `bun run storybook`.
- [ ] Check `addon-a11y` panel for each story; note any regressions.
- [ ] Run `bun run build-storybook` to confirm production build succeeds.
- [ ] Run `bun run lint` and `bun run format`.
- [ ] Update this doc with any gotchas discovered during implementation.
- [ ] Demo to UX team; capture feedback in a follow-up section below.

---

## Implementation order

Hardest → easiest, so any kinks we hit on the complex components become patterns
we can reuse (and document here) for the simpler ones.

1. **`ResponsiveDonutWithInnerPercent`** — wraps `@nivo/pie`'s `ResponsivePie`
   and uses a `MutationObserver` for async SVG a11y labeling. Highest-risk
   inside the Storybook iframe; solving it first de-risks the two Card wrappers
   that embed it.
2. **`DonutGraphWithLegendCard`** — composes the donut with legend rendering;
   exercises shared percent helpers (`computeDisplayPercents`).
3. **`LineGraphWithLegendCard`** — second Card composite; confirms the Redux /
   `MemoryRouter` global decorators are sufficient for the Cards family.
4. **`BigBudgetCard`** → **`BudgetCard`** → **`ReceivedFundingCard`** — same
   file family; do the largest portfolio-level view first, then the variants.
5. **`HorizontalStackedBar`** — mind the numeric-`value` vs. display-`percent`
   split; keyboard-focus story needs addon-a11y attention.
6. **`LineGraph`** + **`ReverseLineGraph`** — share fixture shapes.
7. **`LineBar`** — simplest; lands last as a quick win.

## Open questions

- **Fixture data location** — **Decided:** keep realistic sample data **inline**
  in each `*.stories.jsx` file for Phase 1. Each story stays self-contained and
  readable during the UX demo. If the exact same dataset starts appearing in
  three or more stories, extract that one dataset to
  `frontend/src/components/UI/__fixtures__/` at that time — don't pre-extract.
- **Router/Redux needs for Cards** — confirm per-card whether the global
  `MemoryRouter` default route is sufficient or if specific `initialEntries` are
  needed.
- **Demo format for UX team** — **Decided:** local `bun run storybook`
  walkthrough (screen-share). Deployed `/storybook` on dev is blocked on Azure
  config from DevOps; we'll revisit async access once that lands.

## Demo notes / UX feedback

_(Populated after the demo.)_

---

## Changelog

- **2026-04-24** — Initial plan drafted alongside issue kickoff.
