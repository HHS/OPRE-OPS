# Storybook — Conventions & Developer Guide

## Running Storybook locally

```bash
# From the frontend/ directory
bun run storybook
# Opens at http://localhost:6006
```

Or via Docker Compose (opt-in profile):

```bash
docker compose --profile storybook up storybook
```

## Where stories live

Stories are **co-located** with their component, following the same pattern as unit tests:

```
src/components/UI/DataViz/LineGraph/
  LineGraph.jsx
  LineGraph.test.jsx        ← unit test
  LineGraph.stories.jsx     ← story
```

Never put stories in a top-level `src/stories/` directory.

## Story file naming

- File: `ComponentName.stories.jsx`
- Default export: CSF meta object with `title` and `component`
- Named exports: individual story variants

```jsx
// LineGraph.stories.jsx
import LineGraph from "./LineGraph";

export default {
    title: "UI/DataViz/LineGraph",
    component: LineGraph,
};

export const Default = {
    args: {
        leftValue: 500000,
        rightValue: 250000,
    },
};

export const InProgress = {
    args: {
        leftValue: 300000,
        rightValue: 450000,
        isInProgress: true,
    },
};
```

## Title hierarchy

Follow this naming convention so Storybook's sidebar stays organized:

| Component type | Title prefix | Example |
|---|---|---|
| DataViz primitives | `UI/DataViz/` | `UI/DataViz/LineGraph` |
| Card composites | `UI/Cards/` | `UI/Cards/BudgetCard` |
| Shared UI | `UI/` | `UI/Alert` |
| Feature/domain | `Features/<Domain>/` | `Features/CANs/CanCard` |

## Global decorators (configured in preview.jsx)

Every story automatically gets:

1. **Redux `Provider`** — backed by a fresh `setupStore()` instance. To seed specific state:
   ```jsx
   export const WithActiveUser = {
       parameters: {
           store: {
               preloadedState: {
                   auth: { activeUser: { id: 1, full_name: "Chris Doe" } }
               }
           }
       }
   };
   ```

2. **`MemoryRouter`** — so components using `useNavigate` / `Link` / `useLocation` work. To set an initial route:
   ```jsx
   export const OnDetailPage = {
       parameters: {
           reactRouter: { initialEntries: ["/cans/1"] }
       }
   };
   ```

## When to write a story

- **Required**: All new components added to `src/components/UI/`
- **Encouraged**: Feature/domain components that appear on multiple pages or have complex visual states
- **Optional**: Highly page-specific components tightly coupled to a single route

## Coverage exclusion

`*.stories.jsx` files are excluded from the 90% test coverage requirement. Stories are documentation, not tests.

## Accessibility

The `@storybook/addon-a11y` panel runs axe-core on every story automatically. Fix any violations flagged in red before merging. This complements (but does not replace) the Cypress axe-core E2E checks.
