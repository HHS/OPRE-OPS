# Issue 5356 table loading skeleton rollout

## Objective

Standardize API-backed table loading states so list pages show `TableLoadingSkeleton` with real column headers during initial loads and refetches.

## Scope

- Primary target: list pages with API-backed tables
- Loading triggers in scope: initial load, filter changes, fiscal year changes, server-side sort, server-side pagination, and other RTK Query refetches
- Out of scope for phase 1: detail-page tables where sorting/pagination remain local or loading behavior is less uniform

## Reference Pattern

- Use `frontend/src/pages/projects/list/ProjectsList.jsx` and `frontend/src/components/Projects/ProjectsTable/ProjectsTableLoading.jsx` as the baseline implementation
- Keep the page shell mounted and swap only the table area to a skeleton
- Treat `isLoading || isFetching` as the table-loading state when the table is API-backed
- Preserve real table headers, including dynamic fiscal year labels and expandable-row columns when needed

## Rollout Plan

### Phase 1: list pages

- [x] Agreements list
- [x] Budget lines list
- [x] CAN list
- [x] Portfolio list

### Phase 2: detail and assembled-data tables

- [x] Portfolio spending table
- [x] CAN spending table
- [x] CAN funding received table area when parent data is refetching
- [x] Agreement budget lines grouped table area if service-component loading should block table rendering

## Implementation Notes

- Add thin `*TableLoading` wrappers beside each table so headings come from the same source as the live table
- Prefer branching in the page-level `TableSection` instead of replacing the entire page with `Loading...`
- Do not add skeletons for purely client-side sort/pagination unless a server refetch is also happening
- Hide summary cards while the page is in table-refetch mode when the summaries depend on the same API response

## Phase 1 Progress

### Completed

- Added loading wrappers:
    - `frontend/src/components/Agreements/AgreementsTable/AgreementsTableLoading.jsx`
    - `frontend/src/components/BudgetLineItems/AllBudgetLinesTable/AllBudgetLinesTableLoading.jsx`
    - `frontend/src/components/CANs/CANTable/CANTableLoading.jsx`
    - `frontend/src/components/Portfolios/PortfolioTable/PortfolioTableLoading.jsx`
- Updated page loading behavior:
    - `frontend/src/pages/agreements/list/AgreementsList.jsx`
    - `frontend/src/pages/budgetLines/list/BudgetLineItemList.jsx`
    - `frontend/src/pages/cans/list/CanList.jsx`
    - `frontend/src/pages/portfolios/list/PortfolioList.jsx`
    - `frontend/src/pages/portfolios/list/PortfolioList.hooks.js`
- Added or updated tests:
    - `frontend/src/pages/agreements/list/AgreementsList.test.jsx`
    - `frontend/src/pages/budgetLines/list/BudgetLineItemList.test.jsx`
    - `frontend/src/pages/cans/list/CanList.test.jsx`
    - `frontend/src/pages/portfolios/list/PortfolioList.test.jsx`

### Validation

- [x] `bun run test --watch=false src/pages/agreements/list/AgreementsList.test.jsx src/pages/budgetLines/list/BudgetLineItemList.test.jsx src/pages/cans/list/CanList.test.jsx src/pages/portfolios/list/PortfolioList.test.jsx`
- [x] `bun x eslint src/pages/agreements/list/AgreementsList.jsx src/pages/agreements/list/AgreementsList.test.jsx src/pages/budgetLines/list/BudgetLineItemList.jsx src/pages/budgetLines/list/BudgetLineItemList.test.jsx src/pages/cans/list/CanList.jsx src/pages/cans/list/CanList.test.jsx src/pages/portfolios/list/PortfolioList.jsx src/pages/portfolios/list/PortfolioList.hooks.js src/pages/portfolios/list/PortfolioList.test.jsx src/components/Agreements/AgreementsTable/AgreementsTableLoading.jsx src/components/BudgetLineItems/AllBudgetLinesTable/AllBudgetLinesTableLoading.jsx src/components/CANs/CANTable/CANTableLoading.jsx src/components/Portfolios/PortfolioTable/PortfolioTableLoading.jsx`
- [x] `bun run test --watch=false src/components/Portfolios/PortfolioSpending/PortfolioSpending.test.jsx src/pages/cans/detail/CanSpending.test.jsx src/pages/cans/detail/CanFunding.test.jsx src/pages/cans/detail/Can.hooks.test.js src/pages/agreements/details/AgreementBudgetLines.test.jsx`
- [x] `bun run lint:src src/components/CANs/CANBudgetLineTable/CANBudgetLineTableLoading.jsx src/components/CANs/CANFundingReceivedTable/CANFundingReceivedTableLoading.jsx src/components/BudgetLineItems/BudgetLinesTable/BudgetLinesTableLoading.jsx src/components/Portfolios/PortfolioSpending/PortfolioSpending.jsx src/components/Portfolios/PortfolioSpending/PortfolioSpendingTableLoading.jsx src/components/Portfolios/PortfolioSpending/PortfolioSpending.test.jsx src/pages/cans/detail/Can.hooks.js src/pages/cans/detail/Can.hooks.test.js src/pages/cans/detail/Can.jsx src/pages/cans/detail/CanSpending.jsx src/pages/cans/detail/CanSpending.test.jsx src/pages/cans/detail/CanFunding.jsx src/pages/cans/detail/CanFunding.test.jsx src/pages/agreements/details/AgreementBudgetLines.jsx src/pages/agreements/details/AgreementBudgetLines.test.jsx`

## Manual Test Checklist

- [ ] Agreements list: initial load shows skeleton with FY header
- [ ] Agreements list: filter, FY change, sort, and pagination show skeleton instead of stale rows or page-level loading text
- [ ] Budget lines list: initial load and refetches show skeleton with budget-line headers
- [ ] CAN list: initial load and refetches show skeleton while filters, summary query, and table query refresh together
- [ ] Portfolio list: initial load and FY/filter refetches show skeleton with dynamic FY headers
- [ ] Confirm zero-results states still appear after loading completes

## Progress Log

### 2026-03-24

- Documented the rollout plan in repo docs so the branch has a durable source of truth outside issue comments
- Implemented phase 1 across agreements, budget lines, CANs, and portfolios
- Switched list-page loading behavior from page-level `Loading...` states to table-area skeletons
- Preserved dynamic headers in skeleton variants for agreement and portfolio FY columns
- Added targeted unit coverage for the new loading behavior
- Paused after phase 1 for manual QA before starting phase 2

### 2026-03-26

- Implemented phase 2 skeleton loading for portfolio spending, CAN spending, CAN funding received, and agreement budget line grouped tables
- Added dedicated table-loading wrappers for CAN budget line, CAN funding received, agreement budget lines, and portfolio spending table areas
- Split CAN detail loading so initial page load still blocks the page, while background detail refetches can swap only the relevant table areas to skeletons
- Kept the agreement grouped-area change intentionally narrow by only showing the skeleton while services component data is still loading
- Added targeted unit coverage for each new phase 2 loading branch and verified the touched files with ESLint

## Working Agreement

- Use this doc as the implementation tracker for issue `#5356`
- Keep ticket comments lightweight or optional; update this file as work progresses
