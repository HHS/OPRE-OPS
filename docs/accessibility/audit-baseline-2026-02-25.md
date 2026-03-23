# Accessibility Audit Baseline (Frontend)

Date: 2026-02-25
Standard: WCAG 2.1 AA
Scope: Frontend E2E flows and shared UI components

## Baseline Summary

- Baseline measured: `2026-02-25`
- Status reviewed: `2026-03-11`
- Total Cypress E2E specs: `42`
- Specs currently invoking `checkA11y` (actively executing): `38`
- Specs currently not invoking `checkA11y`: `4`
- Global axe suppression currently present: none
- Critical regression spec gap closed on `2026-03-11`: `frontend/cypress/e2e/notificationCenter.cy.js` now calls `injectAxe/checkA11y`
- Scoped `link-name` allowlist entries removed on `2026-03-11` for the current critical regression set

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
| A11Y-BASELINE-0001 | Global Cypress axe config | `link-name` | moderate | 2.4.4 | Run E2E a11y checks with default global config | Remove global disable and fix icon-only links with accessible names | fixed |
| A11Y-BASELINE-0002 | `createAgreementWithValidations` review flow | `landmark-one-main` | moderate | 1.3.1 | Open review page and run a11y check | Remove duplicate `main` landmark in legacy layout | accepted exception |
| A11Y-BASELINE-0003 | `createAgreementWithValidations` review flow | `region` | minor | 1.3.1 | Open review page and run a11y check | Ensure all content is inside landmark regions | accepted exception |
| A11Y-BASELINE-0004 | `notificationCenter.cy.js` critical regression flow | process gap | moderate | N/A | Review CI regression spec list and compare with spec-level axe invocation | Add active `cy.injectAxe()` and `cy.checkA11y()` to the notification center spec so gate coverage matches intent | fixed |
| A11Y-BASELINE-0005 | Shared header/profile and agreement navigation links | `link-name` | moderate | 2.4.4 | Run critical list/detail/create Cypress specs without `link-name` allowlist entries | Add fallback accessible names to shared profile and agreement detail links | fixed |
| A11Y-BASELINE-0006 | Agreement detail and review route loading states | `landmark-one-main`, `page-has-heading-one`, `region` | moderate | 1.3.1 | Navigate into agreement detail or review routes and run axe during loading transitions | Keep loading states inside `App` so landmarks and headings remain present throughout route transitions | fixed |
| A11Y-BASELINE-0007 | Decorative portfolio and budget line SVG icons | `svg-img-alt` | minor | 1.1.1 | Run `portfolioDetail` and `budgetLineItemsList` specs without svg allowlist entries | Mark decorative chart/action SVGs `aria-hidden` or otherwise remove them from the accessibility tree | fixed |

## Wave 3 Notes

- Wave 3 is remediation-first: remove broad suppressions, close gaps between gated specs and actual axe execution, and shrink the temporary allowlist.
- Developer progress tracker: `docs/developers/frontend/accessibility/issue-5149-wave-3.md`
- Completed in current slice:
  - active axe execution added to `frontend/cypress/e2e/notificationCenter.cy.js`
  - non-gated global `link-name` suppression removed from `frontend/cypress/support/e2e.js`
  - all scoped `link-name` allowlist entries removed after targeted component fixes and Cypress validation
  - structural allowlist entries removed for `agreementDetails`, `budgetLineItemsList`, and review/upload-related route transitions
  - svg allowlist entries removed for `portfolioDetail` and `budgetLineItemsList`

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
