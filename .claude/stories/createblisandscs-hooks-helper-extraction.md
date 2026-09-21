# Refactor plan: extract pure helpers from CreateBLIsAndSCs.hooks.js

## Why
Move every function in the hook that's fully described by "given these inputs, return this output" — no `useState`, `dispatch`, or `setAlert` involved — into a sibling `CreateBLIsAndSCs.helpers.js`. None of these touch React state, so extracting them doesn't change the hook's behavior or public API, it just shrinks the file and makes that logic unit-testable as plain function calls. This also matches how the codebase already separates pure logic into `.helpers.js` files elsewhere (`agreement.helpers.js`, `budgetLines.helpers.js`).

## Estimated impact
~300 lines removed (~1,432 → ~1,130 lines, about a 22% reduction).

## Steps
1. Create `CreateBLIsAndSCs.helpers.js`
2. Move `isDeletionRoutedToApproval` and `getBudgetLinesUrl` into it as-is
3. Move `addServiceComponentIdToBLI` and `addGrantNumberIdToBLI` into it as-is
4. Move `createBudgetChangeMessages`'s body into a pure `buildBudgetChangeMessages(tempBudgetLines, cans)`, wrapped in a thin `useCallback` back in the hook
5. Extract the new-agreement payload-shaping block from `handleSave` into `buildNewAgreementBudgetPayload({...})`
6. Extract the existing-agreement link-resolution glue from `handleSave` into `linkBudgetLinesToApi({...})`
7. Extract the object-construction half of `handleAddBLI` into `buildNewBudgetLineItem({...})`
8. Extract the object-construction half of `handleEditBLI` into `buildEditedBudgetLinePayload({...})` — biggest single win at ~85 lines
9. Extract the object-construction half of `handleDuplicateBudgetLine` into `buildDuplicatedBudgetLineItem({...})`
10. Update imports in `CreateBLIsAndSCs.hooks.js` to pull all of the above from `./CreateBLIsAndSCs.helpers`
