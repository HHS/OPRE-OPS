# Accessibility Audit Baseline (Frontend)

Date: 2026-02-25
Standard: WCAG 2.1 AA
Scope: Frontend E2E flows and shared UI components

## Baseline Summary

- Total Cypress E2E specs: `41`
- Specs currently invoking `checkA11y` (actively executing): `34`
- Specs with commented-out `checkA11y` hooks (not included above): `3`
- Global axe suppression currently present: `link-name` (planned follow-up to remove in `frontend/cypress/support/e2e.js`)

## Phase 1 Target Flows

- Agreements list and details
- Budget lines list and edit flow
- Portfolio list and details
- Auth/login
- Upload document
- Notification center

## Normalized Findings Schema

Each finding must be tracked with:

- `finding_id`
- `route/component`
- `axe_rule`
- `impact`
- `wcag_criterion`
- `repro_steps`
- `proposed_fix`
- `status` (`new`, `existing`, `accepted exception`)

## Initial Findings Register

| finding_id | route/component | axe_rule | impact | wcag_criterion | repro_steps | proposed_fix | status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A11Y-BASELINE-0001 | Global Cypress axe config | `link-name` | moderate | 2.4.4 | Run E2E a11y checks with default global config | Remove global disable and fix icon-only links with accessible names | existing |
| A11Y-BASELINE-0002 | `createAgreementWithValidations` review flow | `landmark-one-main` | moderate | 1.3.1 | Open review page and run a11y check | Remove duplicate `main` landmark in legacy layout | accepted exception |
| A11Y-BASELINE-0003 | `createAgreementWithValidations` review flow | `region` | minor | 1.3.1 | Open review page and run a11y check | Ensure all content is inside landmark regions | accepted exception |

## Regression Gate Onboarding

Initial critical specs for the regression gate:

1. `frontend/cypress/e2e/agreementList.cy.js`
2. `frontend/cypress/e2e/agreementsPagination.cy.js`
3. `frontend/cypress/e2e/agreementDetails.cy.js`
4. `frontend/cypress/e2e/portfolioList.cy.js`
5. `frontend/cypress/e2e/portfolioDetail.cy.js`
6. `frontend/cypress/e2e/budgetLineItemsList.cy.js`
7. `frontend/cypress/e2e/createAgreement.cy.js`
8. `frontend/cypress/e2e/createAgreementWithValidations.cy.js`
9. `frontend/cypress/e2e/uploadDocument.cy.js`
10. `frontend/cypress/e2e/notificationCenter.cy.js`
