# Frontend AGENTS.md

This file provides frontend-scoped guidance for agents and developers working in `frontend/`.

## Key Frontend Conventions

### Vest v6 Form Validation

Canonical guidance: repository root `AGENTS.md` under `Vest v6 Form Validation Patterns`.

- Numeric fields must not use `isNotBlank()`.
- Use `suite.run(data)`, not `suite(data)`.
- Do not call `only(data)` with a whole form object.
- Avoid `suite.reset()` during render.

See root `AGENTS.md` for examples and rationale.

### Data-Viz Percentage Display Convention

Canonical guidance: repository root `AGENTS.md` under `Data-Visualization Percentage Display Convention`.

- Source of truth: `frontend/src/helpers/utils.js`
- Use `computeDisplayPercent(value, total)` for single-item display percent logic.
- Use `computeDisplayPercents(items)` for whole-part chart legends and labels.
- Do not use raw `Math.round()` directly for displayed chart percentages.
- Do not pre-apply `applyMinimumArcValue` to legend data.
- `HorizontalStackedBar` must size and filter by numeric `value`, not display `percent`.

Key display rules:

- Exact zero displays as `0%`.
- Non-zero values that would round to `0%` display as `<1%`.
- A dominant value that would round to `100%` with non-zero peers displays as `99%`.
- Whole-part labels use largest remainder when needed so displayed integers sum to `100%`.

#### Components affected by this convention

This rule applies to shared chart components and to feature components that prepare chart legend data, including:

- `src/components/Agreements/`
- `src/components/BudgetLineItems/`
- `src/components/Portfolios/`
- `src/components/Projects/`
- `src/components/UI/DataViz/`

### Fee Percentage Format Convention

Canonical guidance: repository root `AGENTS.md` under `Fee Percentage Format Convention`.

- Backend/storage format: `5.0` means `5%`
- `calculateTotal` in `src/helpers/agreement.helpers.js` expects whole numbers
- Do not pre-divide fee percentages by `100` before calling helpers
- Use whole-number fee percentages in frontend tests too

For full examples and rationale, see the repository root `AGENTS.md`.
