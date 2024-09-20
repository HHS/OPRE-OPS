# Process for Creating and Using Types

This document describes the process for creating and using types in OPS based on TypeScript best practices and conventions in a JS Doc format.

## Creating a Type Definition

1. **Create a new file co-located with the component directory**. The file should be named after the type it defines that type names should be in PascalCase. For example, a type definition for a user object should be named `UserTypes.d.ts`.

```markdown
src/components/Users
├── UsersEmailComboBox
├── UserInfo
├── IserInfoForm
└── UserTypes.d.ts
```

The `.d.ts` extension is used to indicate that the file contains type definitions and does not contain any executable code.

2. **Define the type**. The type definition should be exported and named. The type should be defined using the `type` keyword.

```typescript
export type SafeUser = {
    email: string;
    full_name: string;
    id: number;
};
```


## Using a Type Definition

1. **Import the type**. Import the type in the component file where it is used. Since we are using JS Doc, the type should be imported using the `@typedef` tag and imported as a module.

```jsx
// src/components/Users/UserInfo.jsx

/**
 * Renders the User information.
 * @component
 * @typedef {import("../UserTypes").SafeUser} User
 * @param {Object} props - The component props.
 * @param {User} props.user - The user object.
 * @param {Boolean} props.isEditable - Whether the user information is editable.
 * @returns {JSX.Element} - The rendered component.
 */
const UserInfo = ({ user, isEditable }) => {
...
```

2. Another example of using a type definition with a list or array:

Let's say you have a CANs component ytree like this:

```markdown
src/components/CANs
├── CANBudgetSummary
├── CANTable
├── CanTypes.d.ts
```

The `CanTypes.d.ts` file would look like this:

```typescript
import { BudgetLine } from "../BudgetLineItems/BudgetLineTypes";
import { Portfolio } from "../Portfolios/PortfolioTypes";
import { Project } from "../Projects/ProjectTypes";

export type CAN = {
    active_period: number;
    budget_line_items: BudgetLine[];
    created_by: number | null;
    created_by_user: number | null;
    created_on: Date;
    description: string;
    display_name: string;
    funding_budgets: CANFundingBudget[];
    funding_details: CANFundingDetails;
    funding_details_id: number;
    funding_received: CANFundingReceived[];
    id: number;
    nick_name: string;
    number: string;
    portfolio: Portfolio;
    portfolio_id: number;
    projects: Project[];
    updated_by: number | null;
    updated_by_user: number | null;
    updated_on: Date;
};

...
```

And then you would import the `CAN` type in the `CANTable` component like this:

```jsx
// src/components/CANs/CANTable.jsx

/**
 * CANTable component of CanList
 * @component
 * @typedef {import("../CANTypes").CAN} CAN
 * @param {Object} props
 * @param {CAN[]} props.cans - Array of CANs
 * @returns {JSX.Element}
 */
const CANTable = ({ cans }) => {
    const CANS_PER_PAGE = 10;
...
```

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [JSDocs TypeDefinition](https://jsdoc.app/tags-typedef)
- [JSDocs Types](https://jsdoc.app/tags-type)
- [ThePrimeTimeagen inspiration TY Short](https://www.youtube.com/shorts/tj5VW2xJsqU)
```
