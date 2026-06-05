import BLIStatusSummaryCard from "./BLIStatusSummaryCard";

export default {
    title: "Features/BudgetLineItems/BLIStatusSummaryCard",
    component: BLIStatusSummaryCard,
    parameters: {
        docs: {
            description: {
                component:
                    "Summary card displaying total budget line amounts broken down by status (Draft, " +
                    "Planned, Executing, Obligated). Shows a donut chart on the right when `totalAmount > 0`; " +
                    "the legend is always rendered."
            }
        }
    },
    argTypes: {
        titlePrefix: { control: "text", table: { category: "General" } },
        totalDraftAmount: {
            control: { type: "number", min: 0, step: 25_000 },
            table: { category: "Amounts by Status" }
        },
        totalPlannedAmount: {
            control: { type: "number", min: 0, step: 25_000 },
            table: { category: "Amounts by Status" }
        },
        totalExecutingAmount: {
            control: { type: "number", min: 0, step: 25_000 },
            table: { category: "Amounts by Status" }
        },
        totalObligatedAmount: {
            control: { type: "number", min: 0, step: 25_000 },
            table: { category: "Amounts by Status" }
        },
        totalAmount: {
            control: { type: "number", min: 0, step: 25_000 },
            table: { category: "Totals" }
        }
    }
};

export const Populated = {
    args: {
        titlePrefix: "FY 2025",
        totalDraftAmount: 100_000,
        totalPlannedAmount: 250_000,
        totalExecutingAmount: 150_000,
        totalObligatedAmount: 75_000,
        totalAmount: 575_000
    }
};

export const Empty = {
    args: {
        titlePrefix: "FY 2025",
        totalDraftAmount: 0,
        totalPlannedAmount: 0,
        totalExecutingAmount: 0,
        totalObligatedAmount: 0,
        totalAmount: 0
    }
};
