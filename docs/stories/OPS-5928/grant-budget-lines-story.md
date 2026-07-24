# Feature Story: Grant Budget Lines (OPS-5928)

## Story Overview

**Ticket:** OPS-5928
**Title:** Grant Numbers & Budget Lines — link budget lines to Grant Numbers (create/edit/delete)

## Background

### Current State
Grant agreements cannot have budget lines created/edited/deleted. Step 3 of the Create Agreement
wizard (and the Agreement Details page) shows only a placeholder for grants at
`CreateBLIsAndSCs.jsx:470-473`. The Grant Numbers subsystem (backend model + CRUD, frontend
components, editor-context reducer, save-bundle `grant_numbers` slice) already exists on this branch.

### Desired State
Grant budget lines work exactly like Contract budget lines, except the "Services Component" concept
is replaced by "Grant Number." A budget line is associated with one of the agreement's Grant Numbers
and budget lines are grouped by Grant Number in an accordion preview.

### User Story
As an OPS user creating a grant agreement, I want to add budget lines associated with a Grant Number
so that I can outline how each grant will be funded.

### Acceptance Criteria
- [ ] A budget line on a grant agreement can be created against a Grant Number.
- [ ] Budget lines are grouped by Grant Number in an accordion (mirroring Contract SC grouping).
- [ ] Budget lines can be edited (including reassigning the Grant Number) and deleted.
- [ ] Persists via both the new-agreement create path and the edit-bundle path (`grant_number_id`).

## The Core Gap
No `grant_number_id` / `grant_number_ref` counterpart to `services_component_id` /
`services_component_ref` exists on the budget line item. This story adds it end-to-end.

## Implementation
See the full approved plan at `~/.claude/plans/we-need-to-create-synthetic-eagle.md`.
Guiding principle: mirror the Services Component path (`services_component_id` lives on the **base**
`BudgetLineItem` and threads generically through schema → services → cleaner → form → grouping).

### Build order
1. Backend model FK + migration (grant_number_id on base BudgetLineItem + version table).
2. Backend schemas (grant_number_id, grant_number_ref w/ mutual exclusivity, response).
3. Backend ref resolution (edit-bundle + atomic create) + /sync-openapi.
4. Backend tests.
5. Frontend types + AllGrantNumberSelect.
6. BudgetLinesForm grant variant + Vest suite key (gated by isGrant).
7. Hook threading (grant_number_number: add/edit/edit-by-id/hydration/clean/addGrantNumberIdToBLI).
8. groupByGrantNumber helper + GrantNumberAccordion + replace placeholder.
9. Wire link into both save paths.
10. Frontend tests + lint/format.

## Risks
- Editor state keys grant numbers by `number`, not DB `id` (like SC) — temp BLIs use `grant_number_number`.
- Not-yet-persisted grant numbers use the `ref` mechanism; grant numbers must be created before BLIs.
- Vest suite must skip the inactive select group by `isGrant` or the Add button never enables.
- Agreement Details page must reseed `grant_numbers` into editor context for correct grouping on refetch.

## Verification
- Backend: `pipenv run pytest`, `pipenv run nox -s lint`; migration round-trip on fresh DB.
- Frontend: `bun run test --watch=false` (≥90%), `bun run lint --fix`, `bun run format`.
- E2E/manual: extend `cypress/e2e/createGrantAgreement.cy.js`; full-stack create → add grant numbers →
  add/edit/delete budget lines grouped by grant number → save → confirm `grant_number_id` after reload.
