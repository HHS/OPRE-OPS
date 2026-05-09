import BigBudgetCard from "./BigBudgetCard";

export default {
    title: "UI/Cards/BigBudgetCard",
    component: BigBudgetCard,
    decorators: [
        (Story) => (
            <div style={{ padding: "2rem" }}>
                {/* CSS module `width: 29.125rem` on RoundedBox wins over USWDS `width-full`
                    in Storybook's dev-mode cascade. Override by targeting the hardcoded id. */}
                <style>{"#big-budget-summary-card { width: 100% !important; }"}</style>
                <Story />
            </div>
        )
    ],
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component:
                    "Portfolio-level budget summary card. Displays the remaining available budget as a large " +
                    "currency figure alongside a striped two-segment bar showing spending vs. remaining. Shows " +
                    "an **Over Budget** warning tag and switches the bar to red when `totalSpending` exceeds " +
                    "`totalFunding`. Bar is hidden when both values are `0`."
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
        }
    }
};

/**
 * Normal state — spending is well within budget.
 * Bar shows spending (solid) vs remaining (striped). "Available" tag visible.
 * Use **Controls** to adjust spending and funding live.
 */
export const Default = {
    args: {
        title: "FY 2025 Available CAN Budget *",
        totalSpending: 1_250_000,
        totalFunding: 2_000_000
    }
};

/**
 * Spending exceeds total funding.
 * Bar turns solid red, "Over Budget" warning tag replaces "Available".
 * Remaining budget displays as a negative value.
 */
export const OverBudget = {
    args: {
        title: "FY 2025 Available CAN Budget *",
        totalSpending: 2_400_000,
        totalFunding: 2_000_000
    }
};

/**
 * Both values are zero — bar is hidden.
 * Card still renders the heading cleanly with no crash.
 */
export const ZeroBudget = {
    args: {
        title: "FY 2025 Available CAN Budget *",
        totalSpending: 0,
        totalFunding: 0
    }
};
