import BudgetCard from "./BudgetCard";

export default {
    title: "UI/Cards/BudgetCard",
    component: BudgetCard,
    parameters: {
        docs: {
            description: {
                component:
                    "CAN-level budget summary card. Displays the remaining available budget with a striped " +
                    "two-segment bar showing spending vs. remaining. Shows an **Over Budget** warning tag and " +
                    "switches the bar to red when `totalSpending` exceeds `totalFunding`. Bar is hidden when " +
                    "both values are `0`. Typically used in a grid alongside other CAN cards."
            }
        }
    },
    argTypes: {
        title: {
            control: "text",
            description: "Card heading — typically includes the fiscal year"
        },
        totalSpending: {
            control: { type: "number", min: 0, step: 50_000 },
            description: "Sum of all BLs in Planned, Executing, and Obligated status"
        },
        totalFunding: {
            control: { type: "number", min: 0, step: 50_000 },
            description: "Total available budget"
        },
        cardId: {
            control: false,
            description: "Used for `data-cy` test targeting — not visually relevant"
        }
    }
};

/**
 * Normal state — spending is within budget.
 * "Available" tag and striped bar visible.
 * Use **Controls** to adjust spending and funding live.
 */
export const Default = {
    args: {
        cardId: 2025,
        title: "FY 2025 CANs Available Budget",
        totalSpending: 875_000,
        totalFunding: 1_500_000
    }
};

/**
 * Spending exceeds total funding.
 * Bar turns solid red, "Over Budget" warning tag replaces "Available".
 */
export const OverBudget = {
    args: {
        cardId: 2025,
        title: "FY 2025 CANs Available Budget",
        totalSpending: 1_750_000,
        totalFunding: 1_500_000
    }
};

/**
 * Both values are zero — bar is hidden, "Available" tag is absent.
 * Card still renders the heading and $0 cleanly.
 */
export const ZeroBudget = {
    args: {
        cardId: 2025,
        title: "FY 2025 CANs Available Budget",
        totalSpending: 0,
        totalFunding: 0
    }
};
