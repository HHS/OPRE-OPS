## Goals

- Establish reliable automated accessibility baseline for key user flows.
- Remove broad/global suppressions and replace with scoped exceptions only where justified.
- Add phased CI regression gate so new violations fail while legacy debt is tracked.

## Tasks

- [ ] Produce and maintain normalized findings register in `docs/accessibility/audit-baseline-2026-02-25.md`.
- [ ] Re-enable disabled/commented Cypress `injectAxe/checkA11y` hooks for identified specs.
- [ ] Remove global `link-name` suppression and migrate to temporary scoped allowlist entries with expiry.
- [ ] Add CI regression gate for critical specs with `A11Y_REGRESSION_GATE=true`.
- [ ] Add suppression hygiene validation (`owner`, `expires`, `rationale`) for any `enabled: false` usage.
- [ ] Open child remediation issues for all non-blocking findings by severity batch (A/B/C).

## Definition Of Done

- [ ] Audit report committed with finding IDs, severity, WCAG mapping, affected routes/components.
- [ ] Disabled a11y checks re-enabled (or time-boxed exception with owner/date and rationale).
- [ ] CI regression gate active for selected critical flows.
- [ ] Child remediation issues created for all non-blocking findings.

## Additional Context

- Standard target: WCAG 2.1 AA
- Phase 1 scope: Frontend E2E + shared UI components
- Baseline reference: `docs/accessibility/audit-baseline-2026-02-25.md`
