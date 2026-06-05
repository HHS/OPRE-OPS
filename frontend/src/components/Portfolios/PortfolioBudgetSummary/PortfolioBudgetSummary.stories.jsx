import PortfolioBudgetSummary from "./PortfolioBudgetSummary";

export default {
    title: "Features/Portfolios/PortfolioBudgetSummary",
    component: PortfolioBudgetSummary,
    parameters: {
        docs: {
            description: {
                component:
                    "Top-level portfolio summary: a `BigBudgetCard` for available budget, a " +
                    "`ProjectAgreementBLICard` showing counts by project/agreement/budget-line type, and a " +
                    "`DonutGraphWithLegendCard` for budget lines by status."
            }
        }
    },
    argTypes: {
        fiscalYear: { control: { type: "number" } },
        totalFunding: { control: { type: "number", min: 0, step: 100_000 } },
        inExecutionFunding: { control: { type: "number", min: 0, step: 100_000 } },
        obligatedFunding: { control: { type: "number", min: 0, step: 100_000 } },
        plannedFunding: { control: { type: "number", min: 0, step: 100_000 } },
        inDraftFunding: { control: { type: "number", min: 0, step: 100_000 } }
    }
};

export const Populated = {
    args: {
        fiscalYear: 2025,
        totalFunding: 8_000_000,
        inDraftFunding: 500_000,
        plannedFunding: 2_000_000,
        inExecutionFunding: 1_500_000,
        obligatedFunding: 1_000_000,
        projectTypesCount: [
            { type: "RESEARCH", count: 4 },
            { type: "ADMINISTRATIVE_AND_SUPPORT", count: 2 }
        ],
        agreementTypesCount: [
            { type: "CONTRACT", count: 5 },
            { type: "GRANT", count: 3 },
            { type: "DIRECT_OBLIGATION", count: 1 }
        ],
        budgetLineTypesCount: [
            { type: "DRAFT", count: 2 },
            { type: "PLANNED", count: 6 },
            { type: "IN_EXECUTION", count: 4 },
            { type: "OBLIGATED", count: 3 }
        ]
    }
};

export const Empty = {
    args: {
        fiscalYear: 2025,
        totalFunding: 0,
        inDraftFunding: 0,
        plannedFunding: 0,
        inExecutionFunding: 0,
        obligatedFunding: 0,
        projectTypesCount: [],
        agreementTypesCount: [],
        budgetLineTypesCount: []
    }
};
