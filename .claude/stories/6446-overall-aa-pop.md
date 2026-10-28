---
issue: 6446
branch: OPS-6446/overall-aa-pop
---

# Overall AA PoP

## Goal

Show the overall Agreement Period of Performance (earliest SC start, latest SC end) on AA Agreement Details so CORs can see an AA's full lifespan, reusing the contract implementation from #1993.

## Acceptance Criteria

- [ ] User can discern an overall AA Period of Performance dates when viewing other agreement metadata. These dates shall be derived of the earliest start date among all SCs and the latest of all end dates on all SCs.
- [ ] When an SC's PoP start/end date is modified such that the new date value is now either the earliest start date among all SCs on the AA, or is now the latest end date on all SCs, then that new date should be automagically reflected in the AA's overall PoP

## Technical Details

### Approach

Add `AgreementFields.PeriodOfPerformance` to the `[AgreementType.AA]` set in `AGREEMENT_TYPE_VISIBLE_FIELDS`. Reuse the existing PoP tag + tooltip in `AgreementDetailsView.jsx`, `formatPeriodOfPerformance`, and the backend `Agreement.sc_start_date`/`sc_end_date` computed properties (already serialized for `AaAgreementResponse` via `AgreementResponse`). AC2 is already satisfied: all SC write paths (add/update/delete/edit-bundle) invalidate the `Agreements` RTK tag, so `getAgreementById` refetches. Placement matches the contract Figma slot (directly after Nickname; Figma's "3rd item" counts a Project row not built in this column) — no JSX change needed. Confirmed: AA uses the same order as contracts.

### Key Files

- `frontend/src/helpers/agreement.helpers.js` — AA visible-fields set
- `frontend/src/pages/agreements/details/AgreementDetailsView.test.jsx`

### Testing Strategy

- Vitest + RTL in `AgreementDetailsView.test.jsx`: parametrize the existing contract PoP tests (formatted range, `TBD`, tooltip via `aria-describedby`) with `it.each(["CONTRACT", "AA"])`; keep the GRANT "not rendered" test passing and rename it from "non-contract agreement types" to GRANT.
- Tighten the TBD assertion to the `period-of-performance-tag` data-cy — the current `getAllByText("TBD").length > 0` passes on AA pages via other TBD tags even if PoP shows a date.
- No `isFieldVisible` unit test (config-map entry = implementation detail).
- No new backend tests — `test_agreement_sc_dates.py` already covers min/max logic.
- No E2E; AC2 is RTK Query tag invalidation (framework behavior) — verify SC mutations' `invalidatesTags` in review rather than testing it.

### Constraints

- Partial dates: if no SC has an end (or start) date, the whole tag shows `TBD` — matches existing contract behavior.
- Optional cleanup: AA set lists `Methodologies`, `SpecialTopic`, `NickName` twice (harmless, it's a Set).
