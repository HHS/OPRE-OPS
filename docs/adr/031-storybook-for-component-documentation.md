# 31. Storybook for Component Documentation

Date: 2026-04-17

## Status

Accepted

## Context

OPRE OPS has a growing library of reusable React components — data-visualization primitives (`HorizontalStackedBar`,
`LineGraph`, `ResponsiveDonutWithInnerPercent`, etc.), shared UI elements (`Tag`, `Alert`, `Table`, `Modals`), and
feature-domain composites (`CanCard`, `AgreementSpendingCards`, `PortfolioBudgetSummary`). These components are
documented only through inline JSDoc comments and co-located unit tests. There is no dedicated environment for
designers or developers to browse, interact with, or visually review components in isolation.

A proof-of-concept was started in 2022 on the `component-documentation-storybook_js` branch using Storybook 6 with
webpack and Create React App. Since then the frontend has migrated to Vite 8, React 19, Bun, and `@vitejs/plugin-react`
v6 (Oxc pipeline), making the POC obsolete.

### Problems This Solves

1. **Discoverability**: Developers and designers have no single place to see what components exist, what props they
   accept, and how they look in various states.
2. **Design review**: Visual review of components requires running the full app and navigating to the right page with
   the right data — slow and unreliable.
3. **Edge-case coverage**: Components are rarely tested visually with boundary data (zero values, overflow, empty
   states) outside of unit tests.
4. **Onboarding**: New team members must read source code to understand the component library.

## Decision

We will adopt **Storybook 10** with the `@storybook/react-vite` framework for component documentation and sandboxing.

### Tool Choice

| Option | Considered | Decision |
|---|---|---|
| **Storybook 10** | Industry standard, largest addon ecosystem, Vite-native, React 19 support, strong a11y tooling | **Chosen** |
| **Histoire** | Vue-first; React support is experimental and community-maintained | Rejected — immature React support |
| **Ladle** | Minimal Vite-native alternative; very small addon ecosystem, limited documentation | Rejected — insufficient addon ecosystem for our needs |
| **Chromatic** (hosted cloud) | Visual regression SaaS built by Storybook team | Deferred — not needed for initial rollout; can add later |

### Serving Strategy

Storybook will be served at the `/storybook` sub-path of the existing frontend nginx image, available on **dev and
staging environments only**. Production will not include storybook assets.

**Implementation**: The `Dockerfile.azure` build stage conditionally runs `bun run build-storybook --output-dir
build/storybook` only when `MODE != production`. In production, the `build/storybook/` directory simply does not exist,
so nginx returns a 404 via its existing `try_files` directive. No nginx configuration changes are required.

**Local development**: Storybook runs as a standalone Vite dev server on port 6006 via `bun run storybook`, optionally
as a Docker Compose service under the `storybook` profile.

### Story File Convention

Stories are **co-located with their components**, following the modern Storybook convention and matching the existing
co-located test file pattern:

```
src/components/UI/DataViz/LineGraph/
  LineGraph.jsx
  LineGraph.test.jsx
  LineGraph.stories.jsx       <-- new
```

### Test Coverage

`*.stories.jsx` files are **excluded** from the 90% code coverage requirement. Stories are not unit tests — they are
documentation and visual development tools.

### CI Integration

A `bun run build-storybook` check runs in CI, **path-filtered** to only trigger on PRs that modify:
- `frontend/src/components/**`
- `frontend/.storybook/**`

This ensures zero CI overhead on backend-only or docs-only changes.

### Phased Rollout

Implementation is broken into six phases, each tracked as a separate GitHub issue under the parent story (#1224):

1. **Phase 0 — Setup & Infrastructure** (#5524): Install Storybook, configure decorators (Redux, Router, USWDS styles),
   update Docker build, add CI check.
2. **Phase 1 — DataViz Primitives** (#5525): Stories for all `src/components/UI/DataViz/` components and their Card
   wrappers. Pure/presentational — highest value, lowest effort.
3. **Phase 2 — Shared UI Primitives, Batch A** (#5527): High-frequency pure components (`Tag`, `Button`, `Alert`,
   `Table`, `StepIndicator`, etc.).
4. **Phase 3 — Shared UI Primitives, Batch B** (#5528): Components requiring decorators or context (`Modals`,
   `Accordion`, `Form` inputs, `Header`, `NotificationCenter`).
5. **Phase 4 — Feature/Domain Components** (#5529): Selective coverage of reused feature components (`CanCard`,
   `AgreementSpendingCards`, `PortfolioBudgetSummary`) using MSW handlers and mock Redux store.
6. **Phase 5 — CI Gate & Convention Enforcement** (#5530): `eslint-plugin-storybook`, PR template checkbox, developer
   documentation updates.

### Integration with Existing Stack

- **Vite 8**: `@storybook/react-vite` reuses `vite.config.mjs` automatically, including the SVGR plugin and SASS
  configuration.
- **USWDS v3**: Global styles imported in `.storybook/preview.js`, matching `index.jsx`.
- **Redux/RTK Query**: Global `Provider` decorator in `preview.js` with a configurable mock store. Feature components
  use `msw-storybook-addon` for API mocking.
- **React Router**: `withRouter` decorator in `preview.js` for components that use routing hooks.
- **JSDoc/PropTypes**: Storybook 10 auto-generates controls and documentation from PropTypes and JSDoc `@param` annotations.

## Consequences

### Positive

1. **Component discoverability**: Developers and designers can browse all components, their props, and visual states
   in one place.
2. **Faster design review**: Designers can review components without running the full stack or navigating to specific
   pages.
3. **Edge-case visibility**: Stories for zero values, overflow, empty states, and error conditions expose visual bugs
   that unit tests miss.
4. **Accessibility auditing**: The `addon-a11y` panel provides immediate axe-core feedback for every component story.
5. **Developer onboarding**: New team members can explore the component library interactively.
6. **Low maintenance burden**: Co-located stories follow the same pattern as co-located tests — easy to find and update
   alongside the component.

### Negative

1. **Build time**: `build-storybook` adds time to the Docker image build for dev/stg (mitigated by path-filtering in
   CI and omitting from production builds).
2. **Story maintenance**: Stories can drift from components if not updated. Mitigated by co-location, CI build check
   (broken stories fail the build), and the Phase 5 convention enforcement.
3. **Additional dependencies**: Storybook adds `@storybook/*` packages to devDependencies. These are dev-only and do
   not affect the production bundle.

## Related Issues

- #1224 — Parent story
- [ADR 025 — Vite](./025-vite.md) — Storybook uses the same Vite build pipeline
- [ADR 015 — A11y Testing](./015-a11y-testing.md) — `addon-a11y` complements the existing Cypress axe-core a11y checks
