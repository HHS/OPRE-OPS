## Goals

- Establish reliable automated accessibility baseline for key user flows.
- Remove broad/global suppressions and replace with scoped exceptions only where justified.
- Add phased CI regression gate so new violations fail while legacy debt is tracked.

## Tasks

- [x] Produce and maintain normalized findings register in `docs/accessibility/audit-baseline-2026-02-25.md`.
- [x] Re-enable disabled/commented Cypress `injectAxe/checkA11y` hooks for identified specs.
- [x] Remove global `link-name` suppression and migrate fully to temporary scoped allowlist entries with expiry.
- [x] Add CI regression gate for critical specs with `A11Y_REGRESSION_GATE=true`.
- [x] Add suppression hygiene validation (`owner`, `expires`, `rationale`) for any `enabled: false` usage.
- [ ] Open child remediation issues for all non-blocking findings by severity batch (A/B/C).

## Definition Of Done

- [ ] Audit report committed with finding IDs, severity, WCAG mapping, affected routes/components.
- [x] Disabled a11y checks re-enabled (or time-boxed exception with owner/date and rationale).
- [x] CI regression gate active for selected critical flows.
- [ ] Child remediation issues created for all non-blocking findings.

## Additional Context

- Standard target: WCAG 2.1 AA
- Phase 1 scope: Frontend E2E + shared UI components
- Baseline reference: `docs/accessibility/audit-baseline-2026-02-25.md`

## Wave 3 Direction

Wave 3 is focused on remediation-first follow-through for the infrastructure already added in earlier work.

Priority order:

1. Turn on active axe execution for any critical spec listed in the regression gate that still is not calling `injectAxe/checkA11y`.
2. Remove the remaining non-gated global `link-name` suppression in `frontend/cypress/support/e2e.js`.
3. Burn down scoped allowlist entries by fixing source components and updating the findings register.
4. Keep developer-facing progress notes current in `docs/developers/frontend/accessibility/issue-5149-wave-3.md`.

Progress update:

- `notificationCenter.cy.js` now actively executes axe checks.
- Global `link-name` suppression has been removed.
- Scoped `link-name` allowlist entries have been burned down to zero for the current critical regression spec set.
- Scoped structural allowlist entries for agreement-detail/review route transitions have been burned down to zero for the current targeted regression set.
- Scoped `svg-img-alt` allowlist entries have been burned down to zero for the remaining tracked specs.
