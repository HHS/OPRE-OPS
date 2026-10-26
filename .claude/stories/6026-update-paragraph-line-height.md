---
issue: 6026
branch: OPS-6026/paragraph-line-height
---

# Update paragraph text line height

## Goal

Update the leading of default-size (16px) page paragraphs to match the Figma design (24px line, USWDS line-height token 4 = 1.5) without affecting card copy, headings, or other text.

## Acceptance Criteria

- [ ] Change paragraph text line height to match Figma design

## Technical Details

### Approach

Match the reference: 16px paragraph text on a 24px line (USWDS line-height token 4 = 1.5), applied **only to default-size page paragraphs** — not card copy, headings, or any other text. Add one scoped rule to `_uswds-theme-custom-styles.scss` (the existing home for project overrides, e.g. OPS-6327) using the USWDS `line-height("body", 4)` token function, then recompile with `bun run uswds:update`:

`:where(main p:not(<resized>):not(:is(<resized>, <excluded-ancestors>) p)) { line-height: 1.5 }`

- `:where()` keeps specificity at (0,0,0) so any class on the `<p>` itself still wins (`line-height-*` utilities, `.usa-intro`, `.usa-prose > p`, CSS modules), while bare `<p>` beats the inherited 1.15
- `<resized>`: generated in Sass via `@each` over USWDS's `$project-cap-heights` × `$project-type-scale` maps (skipping disabled families/scales and any `size()` == 1rem), plus custom `.font-12px/20px/24px/32px` (cross-referenced from `styles.scss` FONTS) and responsive variants (`[class*=':font-']`)
- `<excluded-ancestors>`: any `line-height-*` utility, `.ops-card` marker, `.usa-card`, `.usa-alert`, `.usa-summary-box`, `.usa-modal`, `table`
- `ops-card` is a semantic opt-out class on card roots (replaces matching on `bg-brand-base-light-variant`)
- `main` excludes header, site banner, and footer

Paragraphs inside USWDS containers also move to 1.5 (e.g. Help Center accordion text 1.6 → 1.5, bare `<p>` in `.usa-form` 1.4 → 1.5) — intended: one leading for default-size paragraph text.

No guard test on compiled CSS (docs/TESTING.md principle 6); a CI compile-and-diff check is tracked as a separate task.

Rejected: `$theme-style-body-element` (changes all text) and `$theme-global-paragraph-styles` (adds `max-width: 68ex` + margin resets to every `<p>`; both also move USWDS component leading 1.6 → 1.5).

Figma reference: https://www.figma.com/design/dsQFe6G2KjcTWNq7NNZujm/OPRE-OPS?node-id=29612-107668

### Key Files

- `frontend/sass/uswds/_uswds-theme-custom-styles.scss` — the scoped paragraph rule
- `frontend/sass/uswds/styles.scss` — cross-reference comment on the `.font-Npx` classes
- `frontend/src/uswds/css/styles.css` — regenerated compiled output (should add exactly one rule)
- `frontend/CLAUDE.md` — "Paragraph Leading (USWDS Sass)" section: `ops-card`, `$ops-p-resized`, recompile
- `ops-card` marker on card roots: `UI/RoundedBox/RoundedBox.jsx`, `UI/Cards/DocumentCard/DocumentCard.jsx`, `UI/Cards/DefinitionListCard/DefinitionListCard.jsx`, `UI/Hero/Hero.jsx`, `CANs/CanCard/CanCard.jsx`, `ChangeRequests/ReviewCard/ReviewCard.jsx`, `Projects/ProjectSummaryCard`, `ProjectAgreementSummaryCard`, `ProjectSelectWithSummaryCard`

### Testing Strategy

No new unit/component/E2E tests — per docs/TESTING.md "When NOT to Write Tests" (visual styling alone without visual regression tooling) and principle 6 (don't test generated artifacts). No Chromatic/visual-regression runs in CI; no existing tests assert on line-height and there are no snapshot tests.

- Run existing suite (`bun run test --watch=false`) as a regression check.
- Diff compiled `styles.css` rule-by-rule to confirm only the one `main p…{line-height:1.5}` rule is added.
- Manual visual check (`/visual-check`) against Figma at desktop widths (OPS does not support mobile) across text-heavy pages: tables, cards, modals, alerts, tags/nav, Help/FAQ — confirm default-size page paragraphs compute to 24px on 16px and card/heading/resized text is unchanged.

### Constraints

- Installed `@uswds/uswds` is 3.13.0 but `package.json`/`bun.lock` say 3.14.0. Compile from the installed 3.13.0 so the `styles.css` diff contains only line-height changes; the 3.14 upgrade is out of scope. Do not run `bun install` before compiling.
- Verify the `styles.css` diff contains only the expected rule.
- New card components should add `ops-card` to their root; new custom `.font-Npx` classes must be added to `$ops-p-resized`.
