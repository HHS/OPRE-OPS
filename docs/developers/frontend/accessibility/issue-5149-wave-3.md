# [A11y][Wave 3] Issue 5149 remediation tracker

## Objective
Use Wave 3 to convert the existing accessibility baseline and regression-gate scaffolding into real debt reduction for issue `#5149`.

## Updated Wave 3 Goals
- [x] Enable active `injectAxe/checkA11y` coverage for every currently gated critical spec.
- [x] Remove the remaining non-gated global `link-name` suppression from `frontend/cypress/support/e2e.js`.
- [x] Reduce scoped allowlist entries by fixing underlying UI issues in critical flows.
- [x] Keep `docs/accessibility/audit-baseline-2026-02-25.md` in sync with current findings and status.
- [ ] Track follow-up remediation issues for any non-blocking findings that remain deferred.

## Current Status Snapshot
- Branch: `OPS-5149/a11y-wave-three`
- Issue: `#5149`
- Working mode: remediation-first
- Existing regression gate: active in `.github/workflows/ci.yml`
- Existing allowlist validation: active in `frontend/cypress/support/a11yAllowlist.js`
- Remaining broad suppression: none

## Wave 3 Workstreams

### 1. Critical spec parity
- [x] `frontend/cypress/e2e/notificationCenter.cy.js` should actively run `cy.injectAxe()` and `cy.checkA11y()`.
- [x] Confirm every spec named in the CI regression gate is actually executing accessibility checks.

### 2. Suppression removal
- [x] Remove the fallback global `link-name` disable in `frontend/cypress/support/e2e.js`.
- [x] Keep only scoped, expiring exceptions in `frontend/cypress/support/a11yAllowlist.js` when justified.

### 3. Allowlist burn-down
- [x] `link-name` findings across agreement, portfolio, budget line, upload, and notification flows
- [x] `svg-img-alt` findings in data visualization and icon-driven components
- [x] `landmark-one-main`, `page-has-heading-one`, and `region` findings in review and upload flows

## Current Allowlist Inventory

| Rule | Entries | Notes |
| --- | --- | --- |
| `link-name` | 0 | Removed on `2026-03-11`; targeted specs now pass without allowlist coverage |
| `svg-img-alt` | 0 | Removed on `2026-03-11`; decorative chart and action icons now hide from assistive tech |
| `landmark-one-main` | 0 | Removed on `2026-03-11` after preserving layout landmarks during route loading |
| `page-has-heading-one` | 0 | Removed on `2026-03-11` after preserving page headings during route loading |
| `region` | 0 | Removed on `2026-03-11` after preserving landmark-wrapped loading states |

## Priority Files
- `frontend/cypress/support/e2e.js`
- `frontend/cypress/support/a11yAllowlist.js`
- `frontend/cypress/e2e/notificationCenter.cy.js`
- `frontend/src/components/UI/NotificationCenter/NotificationCenter.jsx`
- `frontend/src/pages/agreements/review/ReviewAgreement.jsx`
- `frontend/src/components/Agreements/Documents/UploadDocument.jsx`
- `docs/accessibility/audit-baseline-2026-02-25.md`

## Progress Log

### 2026-03-11
- Established Wave 3 as a remediation-first phase rather than more test-surface expansion.
- Identified that regression-gate plumbing and suppression metadata validation are already in place.
- Identified remaining major gaps:
  - `frontend/cypress/e2e/notificationCenter.cy.js` is not yet executing axe checks.
  - `frontend/cypress/support/e2e.js` still applies a non-gated global `link-name` suppression.
  - Baseline summary numbers in `docs/accessibility/audit-baseline-2026-02-25.md` need refreshing.
- Implemented first Wave 3 remediation slice:
  - added active `cy.injectAxe()` and `cy.checkA11y()` coverage to `frontend/cypress/e2e/notificationCenter.cy.js`
  - replaced clickable notification SVGs with accessible buttons in `frontend/src/components/UI/NotificationCenter/NotificationCenter.jsx`
  - removed the fallback global `link-name` suppression from `frontend/cypress/support/e2e.js`
- Validation:
  - `bun run a11y:validate-suppressions` passes
  - `npx cypress run --config-file ./cypress.config.js --headless --spec "cypress/e2e/notificationCenter.cy.js,cypress/e2e/agreementList.cy.js,cypress/e2e/uploadDocument.cy.js"` passes
  - no flaky retries detected in the targeted run
- Completed `link-name` burn-down for currently tracked critical specs:
  - added fallback accessible names to the shared user-profile link in `frontend/src/components/UI/Header/User.jsx`
  - added explicit accessible names to agreement links in `frontend/src/components/BudgetLineItems/AllBudgetLinesTable/AllBLIRow.jsx`
  - added explicit accessible names to agreement links in `frontend/src/components/CANs/CANBudgetLineTable/CANBudgetLineTableRow.jsx`
  - removed all remaining `link-name` allowlist entries from `frontend/cypress/support/a11yAllowlist.js`
- Expanded validation:
  - `npx cypress run --config-file ./cypress.config.js --headless --spec "cypress/e2e/agreementList.cy.js,cypress/e2e/agreementsPagination.cy.js,cypress/e2e/agreementDetails.cy.js,cypress/e2e/portfolioList.cy.js,cypress/e2e/portfolioDetail.cy.js,cypress/e2e/budgetLineItemsList.cy.js,cypress/e2e/createAgreement.cy.js,cypress/e2e/createAgreementWithValidations.cy.js,cypress/e2e/uploadDocument.cy.js,cypress/e2e/notificationCenter.cy.js"` passes
  - no `link-name` failures remain in the targeted regression set
- Completed structural burn-down for the routed agreement/review flows:
  - preserved `App` layout landmarks and page headings during agreement detail loading in `frontend/src/pages/agreements/details/Agreement.jsx`
  - preserved `App` layout landmarks during review-page loading in `frontend/src/pages/agreements/review/ReviewAgreement.jsx`
  - removed the nested page-level `<main>` from `frontend/src/components/Agreements/Documents/UploadDocument.jsx`
  - removed the remaining `landmark-one-main`, `page-has-heading-one`, and `region` allowlist entries from `frontend/cypress/support/a11yAllowlist.js`
- Structural validation:
  - `npx cypress run --config-file ./cypress.config.js --headless --spec "cypress/e2e/agreementDetails.cy.js,cypress/e2e/budgetLineItemsList.cy.js,cypress/e2e/createAgreementWithValidations.cy.js,cypress/e2e/uploadDocument.cy.js"` passes
  - no structural allowlist-backed failures remain in that targeted regression set
- Completed `svg-img-alt` burn-down for the remaining tracked specs:
  - hid decorative portfolio legend and CAN funding icons from assistive tech in `frontend/src/components/Portfolios/PortfolioSummaryCards/PortfolioLegend.jsx` and `frontend/src/components/Portfolios/PortfolioFundingByCAN/PortfolioFundingByCAN.jsx` (note: `PortfolioFundingByCAN` was subsequently removed in #5515)
  - hid decorative external-link icon in `frontend/src/components/Portfolios/PortfolioHero/HeroDescription.jsx`
  - hid decorative budget line summary and change-action icons in `frontend/src/components/BudgetLineItems/BLIStatusSummaryCard/BLIStatusSummaryCard.jsx` and `frontend/src/components/BudgetLineItems/ChangeIcons/ChangeIcons.jsx`
  - removed the final `svg-img-alt` allowlist entries from `frontend/cypress/support/a11yAllowlist.js`
- SVG validation:
  - `npx cypress run --config-file ./cypress.config.js --headless --spec "cypress/e2e/portfolioDetail.cy.js,cypress/e2e/budgetLineItemsList.cy.js"` passes
  - no `svg-img-alt` failures remain in the targeted regression set

## Validation Checklist
- [x] `bun run a11y:validate-suppressions`
- [x] Relevant Cypress regression specs pass locally
- [x] Findings register updated for each removed or narrowed exception
- [ ] Child follow-up issues linked for deferred findings

## Parent Issue Update Draft
Use this comment on the parent issue when Wave 3 changes start landing:

```md
Wave 3 update (`#5149`):

- Shifted this phase to remediation-first work on top of the existing a11y regression gate.
- Added developer tracker: `docs/developers/frontend/accessibility/issue-5149-wave-3.md`
- Current focus:
  - enable active axe execution for all gated critical specs
  - remove the remaining global `link-name` suppression
  - burn down scoped allowlist entries by rule and route

Next implementation targets:
- `frontend/cypress/e2e/notificationCenter.cy.js`
- `frontend/cypress/support/e2e.js`
- `frontend/src/components/UI/NotificationCenter/NotificationCenter.jsx`
- `frontend/src/pages/agreements/review/ReviewAgreement.jsx`
- `frontend/src/components/Agreements/Documents/UploadDocument.jsx`
```
