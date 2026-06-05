import CANSummaryCards from "./CANSummaryCards";

export default {
    title: "Features/CANs/CANSummaryCards",
    component: CANSummaryCards,
    parameters: {
        docs: {
            description: {
                component:
                    "Wraps `LineGraphWithLegendCard` (showing carry-forward vs. new funding) and `BudgetCard` " +
                    "(showing spending vs. available) for a fiscal year's CANs. Pure presentational — receives " +
                    "all amounts as props."
            }
        }
    },
    argTypes: {
        fiscalYear: { control: { type: "number" } },
        totalBudget: { control: { type: "number", min: 0, step: 100_000 } },
        newFunding: { control: { type: "number", min: 0, step: 100_000 } },
        carryForward: { control: { type: "number", min: 0, step: 100_000 } },
        plannedFunding: { control: { type: "number", min: 0, step: 100_000 } },
        obligatedFunding: { control: { type: "number", min: 0, step: 100_000 } },
        inExecutionFunding: { control: { type: "number", min: 0, step: 100_000 } }
    }
};

export const Populated = {
    args: {
        fiscalYear: 2025,
        totalBudget: 5_000_000,
        newFunding: 3_000_000,
        carryForward: 2_000_000,
        plannedFunding: 1_000_000,
        obligatedFunding: 500_000,
        inExecutionFunding: 250_000
    }
};

export const Empty = {
    args: {
        fiscalYear: 2025,
        totalBudget: 0,
        newFunding: 0,
        carryForward: 0,
        plannedFunding: 0,
        obligatedFunding: 0,
        inExecutionFunding: 0
    }
};
