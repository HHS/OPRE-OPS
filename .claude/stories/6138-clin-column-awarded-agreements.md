---
issue: 6138
branch: OPS-6138/clin-column-awarded-agreements
---

# Feature Story: View CLINs on Awarded Agreements

## Story Overview

**Ticket:** #6138
**Title:** View CLINs on Awarded Agreements

## Background

### Current State
- `BudgetLinesTable` (used in the "SCs & Budget Lines" tab at `/agreements/:id/budget-lines`) has no CLIN column
- `AgreementBLIReviewTable` (used in "Change BL Status" at `/agreements/review/:id`) already has a `showCLINColumn` prop but it defaults to `false`
- The backend API already returns `clin: { id, number, name }` nested on every BLI response
- `BudgetLine` TypeScript type already declares `clin_id` and `clin` fields

### Desired State
- A CLIN column appears in the "SCs & Budget Lines" tab for awarded contract agreements
- The same column is enabled in the "Change BL Status" review page for awarded contract agreements
- Draft BLIs show "N/A"; non-draft BLIs show their CLIN number (or "—" if unassigned)
- The Budget Lines list page (`/budget-lines`) is unaffected

### User Story
As an OPS user, I want to view CLINs on an awarded agreement so that I know what CLIN each budget line is assigned to in the award document.

### Acceptance Criteria
- [x] CLIN column only appears for CONTRACT agreement type
- [x] CLIN column only appears when agreement is in awarded status
- [x] Draft BLIs display "N/A" in the CLIN cell
- [x] Non-draft BLIs with an assigned CLIN display the CLIN number (raw integer, e.g. `42`)
- [x] Non-draft BLIs with no CLIN display "—" (em-dash)
- [x] Column appears after "BL ID #", before "Obligate By"
- [x] CLIN column does NOT appear on the Budget Lines list page
- [x] `clin.number = 0` renders as `0`, not "—" (null-check, not truthy check)

## Technical Context

### Related Components
- `frontend/src/components/BudgetLineItems/BudgetLinesTable/BudgetLinesTable.jsx`
- `frontend/src/components/BudgetLineItems/BudgetLinesTable/BudgetLinesTable.constants.js`
- `frontend/src/components/BudgetLineItems/BudgetLinesTable/BLIRow.jsx`
- `frontend/src/pages/agreements/details/AgreementBudgetLines.jsx`
- `frontend/src/pages/agreements/review/ReviewAgreement.jsx`
- `frontend/src/components/BudgetLineItems/BLIReviewTable/BLIReviewTable.jsx` (already has pattern)
- `frontend/src/components/BudgetLineItems/BLIReviewTable/BLIReviewRow.jsx` (reference for CLIN rendering)

### Dependencies
- No backend changes needed — API already returns `clin` on BLI responses
- `AgreementType` constant from `frontend/src/pages/agreements/agreements.constants.js`

### Assumptions
- "Draft" means `budgetLine.status === "DRAFT"` only
- CLIN number displays as a raw integer without the "CLIN " prefix (the column header already says "CLIN")
- Grants can never be contracts, so the grant accordion path in `AgreementBudgetLines.jsx` will always have `showClinColumn={false}` at runtime

## Implementation Plan

### Files to Modify

- `BudgetLinesTable.constants.js` — add new awarded-contract header constant
- `BudgetLinesTable.jsx` — add `showClinColumn` prop, update header selection, pass prop to row
- `BLIRow.jsx` — add `showClinColumn` prop, add CLIN cell, update `ExpandedData` colSpan
- `AgreementBudgetLines.jsx` — derive `isContract`, pass `showClinColumn` to table, pass `includeClin` to export
- `ReviewAgreement.jsx` — add `AgreementType` import, derive `isContract`, pass `showCLINColumn` + `clinReadOnly`
- `budgetLines.helpers.js` — add optional `includeClin` param to `handleExport`
- `BLIReviewRow.jsx` — add `clinReadOnly` prop: render "—"/no-error for missing non-draft CLIN (shared with Award Approval, which must keep "TBD"+error)
- `BLIReviewTable.jsx` (`AgreementBLIReviewTable`) — thread new `clinReadOnly` prop to `BLIReviewRow`

### Implementation Steps

1. **`BudgetLinesTable.constants.js`** — add constant
   ```js
   export const AWARDED_CONTRACT_BUDGET_LINE_TABLE_HEADERS = [
       { heading: "BL ID #",      value: tableSortCodes.budgetLineCodes.BL_ID_NUMBER },
       { heading: "CLIN",         value: "" },
       { heading: "Obligate By",  value: tableSortCodes.budgetLineCodes.OBLIGATE_BY },
       { heading: "FY",           value: tableSortCodes.budgetLineCodes.FISCAL_YEAR },
       { heading: "CAN",          value: tableSortCodes.budgetLineCodes.CAN_NUMBER },
       { heading: "Amount",       value: tableSortCodes.budgetLineCodes.AMOUNT },
       { heading: "Fee",          value: tableSortCodes.budgetLineCodes.FEES },
       { heading: "Total",        value: tableSortCodes.budgetLineCodes.TOTAL },
       { heading: "Status",       value: tableSortCodes.budgetLineCodes.STATUS }
   ];
   ```
   (9 entries — no trailing empty expand-column entry, matching existing pattern)

2. **`BudgetLinesTable.jsx`** — add prop and 3-way header ternary
   ```jsx
   // Prop (default false):
   showClinColumn = false

   // Header selection (preserve isGrant as outer guard):
   tableHeadings={isGrant
       ? GRANT_BUDGET_LINE_TABLE_HEADERS
       : showClinColumn
           ? AWARDED_CONTRACT_BUDGET_LINE_TABLE_HEADERS
           : BUDGET_LINE_TABLE_HEADERS
   }

   // Pass to BLIRow:
   <BLIRow ... showClinColumn={showClinColumn} />
   ```

3. **`BLIRow.jsx`** — add CLIN cell and update colSpan
   ```jsx
   // After BL ID # <td>, add:
   {showClinColumn && (
       <td>
           {budgetLine.status === "DRAFT"
               ? "N/A"
               : budgetLine.clin?.number != null
                   ? budgetLine.clin.number
                   : "—"}
       </td>
   )}

   // ExpandedData colSpan (was: isGrant ? 7 : 9):
   colSpan={isGrant ? 7 : (showClinColumn ? 10 : 9)}
   ```
   Also add `@property {boolean} [showClinColumn]` to JSDoc `BLIRowProps` typedef.

4. **`AgreementBudgetLines.jsx`** — derive and pass
   ```js
   const isContract = agreement?.agreement_type === AgreementType.CONTRACT;
   // Pass to both BudgetLinesTable calls:
   showClinColumn={isContract && isAgreementAwarded}
   ```

5. **`budgetLines.helpers.js`** — add optional `includeClin` parameter to `handleExport`

   Add `includeClin = false` as the 9th (last) argument. When `true`:
   - Insert `"CLIN"` header after `"SC"` (index 6 in the new order)
   - Insert CLIN value in the row mapper after the SC value:
     ```js
     budgetLine.status === "DRAFT"
         ? "N/A"
         : budgetLine.clin?.number != null
             ? budgetLine.clin.number
             : "—"
     ```
   - Shift `currencyColumns` from `[11, 13]` → `[12, 14]` (SubTotal and Procurement shop fee each shift right by 1)

   Current column order → new order when `includeClin=true`:

   | idx | Without CLIN     | idx | With CLIN        |
   |-----|------------------|-----|------------------|
   | 0   | BL ID #          | 0   | BL ID #          |
   | 1   | Portfolio        | 1   | Portfolio        |
   | 2   | Project          | 2   | Project          |
   | 3   | Project Type     | 3   | Project Type     |
   | 4   | Agreement        | 4   | Agreement        |
   | 5   | SC               | 5   | SC               |
   | 6   | Agreement Type   | **6**   | **CLIN**     |
   | 7   | Description      | 7   | Agreement Type   |
   | 8   | Obligate By      | 8   | Description      |
   | 9   | FY               | 9   | Obligate By      |
   | 10  | CAN              | 10  | FY               |
   | **11** | **SubTotal** (currency) | 11  | CAN     |
   | 12  | Procurement shop | **12** | **SubTotal** (currency) |
   | **13** | **Proc shop fee** (currency) | 13 | Procurement shop |
   | 14  | Fee rate         | **14** | **Proc shop fee** (currency) |
   | 15  | Status           | 15  | Fee rate         |
   | 16  | Comments         | 16  | Status           |
   |     |                  | 17  | Comments         |

6. **`BLIReviewRow.jsx`** — add `clinReadOnly` prop (default `false`)

   `BLIReviewRow` is shared by three consumers: `RequestAwardApproval.jsx` and `ApproveAwardApproval.jsx` (Award Approval flow — `showCLINColumn={true}`, where a missing non-draft CLIN must stay "TBD" with red `table-item-error` styling because it gates award submission, see `RequestAwardApproval.jsx:126`), and `ReviewAgreement.jsx` (Change BL Status — where we want "—"/no-styling to match the detail page). Gate the difference behind a new prop so the Award Approval default is unchanged.

   Current logic (lines ~186–201):
   ```js
   const assignedClinNumber = clinAssignments[budgetLine.id];
   const isDraftStatus = budgetLine?.status === BUDGET_LINE_STATUSES.DRAFT;
   const clinNumber = isDraftStatus
       ? "N/A"
       : assignedClinNumber
         ? `CLIN ${assignedClinNumber}`
         : (budgetLine?.clin?.number ?? NO_DATA);
   const clinErrorClasses = !isDraftStatus ? `${addErrorClassIfNotFound(clinNumber, rowInReviewMode)}` : "";
   const clinClasses = rowInReviewMode ? clinErrorClasses : budgetLine.selected ? clinErrorClasses : "";
   ```

   New logic:
   ```js
   const assignedClinNumber = clinAssignments[budgetLine.id];
   const isDraftStatus = budgetLine?.status === BUDGET_LINE_STATUSES.DRAFT;
   const backendClin = budgetLine?.clin?.number;
   const clinNumber = isDraftStatus
       ? "N/A"
       : assignedClinNumber
         ? `CLIN ${assignedClinNumber}`
         : clinReadOnly
           ? (backendClin != null ? backendClin : "—")   // detail-page spec: "—", not "TBD"; != null keeps CLIN 0
           : (backendClin ?? NO_DATA);                     // Award Approval: "TBD" for missing
   // Read-only display never flags a missing CLIN as an error.
   const clinErrorClasses = !isDraftStatus && !clinReadOnly ? `${addErrorClassIfNotFound(clinNumber, rowInReviewMode)}` : "";
   const clinClasses = clinReadOnly ? "" : rowInReviewMode ? clinErrorClasses : budgetLine.selected ? clinErrorClasses : "";
   ```
   Add `@property {boolean} [clinReadOnly]` to the `BLIReviewRowProps` JSDoc typedef.

7. **`BLIReviewTable.jsx`** (`AgreementBLIReviewTable`) — add `clinReadOnly = false` prop, forward it to `<BLIReviewRow clinReadOnly={clinReadOnly} />`, and add the `@param` JSDoc line.

8. **`ReviewAgreement.jsx`** — import and pass
   ```js
   // Add import (not currently in the file):
   import { AgreementType } from "../agreements.constants";

   // Derive after agreement is loaded:
   const isContract = agreement?.agreement_type === AgreementType.CONTRACT;

   // Pass to both AgreementBLIReviewTable calls:
   showCLINColumn={isAgreementAwarded && isContract}
   clinReadOnly={true}
   ```

### Key Decisions

**CLIN display format:** Raw integer (`42`), not `"CLIN 42"`. The column header already reads "CLIN". `BLIReviewRow` uses `"CLIN N"` only for locally-assigned (in-progress award workflow) CLINs — that pattern does not apply to the read-only view here.

**Null-check for `clin.number`:** Use `!= null`, not a truthy check. `clin.number = 0` is a valid CLIN 0 and must render as `0`. (Note: the existing Award Approval path in `BLIReviewRow` uses `?? NO_DATA` + `addErrorClassIfNotFound`, which treats CLIN 0 as falsy/missing and flags it red — a pre-existing edge left unchanged; the new `clinReadOnly` branch avoids it.)

**Review page consistency (`clinReadOnly`):** The Change BL Status page must match the detail page ("—", no error styling), but `BLIReviewRow` is shared with the Award Approval flow, which intentionally shows "TBD"+red to force CLIN assignment before award. Resolved with a new `clinReadOnly` prop (default `false` = existing Award Approval behavior); `ReviewAgreement` passes `clinReadOnly={true}`. Award Approval pages are not touched.

## Testing Strategy

### Unit Tests

#### `BudgetLinesTable.test.js`
- [x] CLIN column absent when `showClinColumn` is not passed (default)
- [x] CLIN column present when `showClinColumn={true}`

#### `BLIRow.test.jsx`
- [x] DRAFT BLI with `showClinColumn=true` renders "N/A" in CLIN cell
- [x] Non-DRAFT BLI with `clin.number = 42` and `showClinColumn=true` renders `42`
- [x] Non-DRAFT BLI with `clin = null` and `showClinColumn=true` renders "—"
- [x] Non-DRAFT BLI with `clin.number = 0` and `showClinColumn=true` renders `0` (not "—")
- **Cell index note:** when `showClinColumn=true`, Amount shifts from `cells[4]` → `cells[5]`, Fee `cells[5]` → `cells[6]`, Total `cells[6]` → `cells[7]`

#### `AgreementBudgetLines.test.jsx`
- [x] CLIN column absent for GRANT agreement (even if awarded)
- [x] CLIN column absent for unawarderd CONTRACT
- [x] CLIN column present for awarded CONTRACT
- [x] Export button passes `includeClin=true` for awarded CONTRACT, `false` otherwise

#### `budgetLines.helpers.test.js`
- [x] Without `includeClin`: headers exclude "CLIN"; `currencyColumns` = `[11, 13]`
- [x] With `includeClin=true`: "CLIN" header inserted after "SC"; `currencyColumns` = `[12, 14]`
- [x] DRAFT BLI exports "N/A" in CLIN column
- [x] Non-DRAFT BLI with `clin.number = 42` exports `42`
- [x] Non-DRAFT BLI with `clin = null` exports "—"

#### `BLIReviewRow.test.jsx`
- [x] `clinReadOnly=true`, non-DRAFT, `clin=null` → renders "—" with **no** `table-item-error` class
- [x] `clinReadOnly=true`, non-DRAFT, `clin.number=0` → renders `0` (not "—"), no error class
- [x] `clinReadOnly=false` (default), non-DRAFT, `clin=null` → still renders "TBD" **with** `table-item-error` (Award Approval regression guard)
- [x] `clinReadOnly=true`, DRAFT → still "N/A"

#### `ReviewAgreement.test.jsx`
- [x] `showCLINColumn={true}` and `clinReadOnly={true}` passed to `AgreementBLIReviewTable` for awarded contract
- [x] `showCLINColumn={false}` for non-contract or non-awarded
- **Pre-existing gap to fix:** add `submitButtonText: "Submit"` to `baseHookReturn` mock to prevent render errors in new assertions

### Validation Checklist
- [x] All tests pass (`bun run test --watch=false`)
- [x] ESLint passes (`bun run lint`)
- [x] Prettier applied (`bun run format`)
- [x] 90% coverage gate passes
- [x] CLIN column visible on an awarded contract agreement's SCs & BLs tab
- [x] CLIN column visible on Change BL Status page for awarded contract, showing "—"/no-error for missing non-draft CLINs
- [x] Award Approval pages (Request/Approve) still show "TBD"+red for missing non-draft CLINs (no regression)
- [x] CLIN column absent on Budget Lines list page
- [x] CLIN column absent on a grant agreement detail page
- [x] Export for awarded contract includes CLIN column with correct values
- [x] Export for non-contract or non-awarded agreement does NOT include CLIN column

## Notes

### Not in Scope
- `AllBudgetLinesTable` / `AllBLIRow` — entirely separate components, no changes needed
- `CreateBLIsAndSCs.jsx` callers of `BudgetLinesTable` — `showClinColumn` defaults to `false`, no changes needed
- `BudgetLineItemList.jsx` export — calls `handleExport` without `includeClin`; stays unchanged
- `RequestAwardApproval.jsx` / `ApproveAwardApproval.jsx` — must remain unchanged; they rely on `BLIReviewRow`'s default (`clinReadOnly=false`) "TBD"+error behavior to gate CLIN assignment before award
- Backend — API already returns `clin` nested on BLI responses

### References
- GitHub Issue: https://github.com/HHS/OPRE-OPS/issues/6138
- Design: SCs & BLs Tab - Awarded Agreement.pdf (attached to issue)
- Reference implementation: `BLIReviewRow.jsx` (existing CLIN rendering pattern)
