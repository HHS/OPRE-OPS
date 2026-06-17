import PortfolioBudgetSummary from "./PortfolioBudgetSummary";

const fundingControl = (category) => ({
    control: { type: "number", min: 0, step: 100_000 },
    table: { category }
});

export default {
    title: "Features/Portfolios/PortfolioBudgetSummary",
    component: PortfolioBudgetSummary,
    decorators: [
        (Story) => (
            <div className="portfolio-budget-summary-story-wrapper">
                <style>
                    {".portfolio-budget-summary-story-wrapper #big-budget-summary-card { width: 100% !important; }"}
                </style>
                <Story />
            </div>
        )
    ],
    parameters: {
        docs: {
            description: {
                component:
                    "Top-level portfolio summary: a `BigBudgetCard` for available budget, " +
                    "`AgreementSpendingCards` for spending by agreement type, `ReportingCountCard` for counts, " +
                    "and two side-by-side cards (`AgreementSpendingSummaryCard` + `BLIStatusSummaryCard`)."
            }
        }
    },
    argTypes: {
        fiscalYear: { control: { type: "number" }, table: { category: "General" } },
        totalFunding: fundingControl("Funding"),
        inDraftFunding: fundingControl("Funding"),
        plannedFunding: fundingControl("Funding"),
        inExecutionFunding: fundingControl("Funding"),
        obligatedFunding: fundingControl("Funding"),
    }
};

const sampleSpendingData = {
    total_spending: 5_500_000,
    agreement_types: [
        { type: "CONTRACT", label: "Contracts", total: 3_000_000, percent: 55, new: 1_800_000, continuing: 1_200_000 },
        { type: "PARTNER", label: "Partner", total: 1_500_000, percent: 27, new: 500_000, continuing: 1_000_000 },
        { type: "GRANT", label: "Grants", total: 800_000, percent: 15, new: 800_000, continuing: 0 },
        { type: "DIRECT_OBLIGATION", label: "Direct Oblig.", total: 200_000, percent: 4, new: 200_000, continuing: 0 }
    ]
};

const sampleCounts = {
    projects: {
        total: 6,
        types: [
            { type: "RESEARCH", count: 4 },
            { type: "ADMINISTRATIVE_AND_SUPPORT", count: 2 }
        ]
    },
    agreements: {
        total: 11,
        types: [
            { type: "CONTRACT", count: 5 },
            { type: "PARTNER", count: 3 },
            { type: "GRANT", count: 2 },
            { type: "DIRECT_OBLIGATION", count: 1 }
        ]
    },
    new_agreements: {
        total: 4,
        types: [
            { type: "CONTRACT", count: 2 },
            { type: "GRANT", count: 2 }
        ]
    },
    continuing_agreements: {
        total: 7,
        types: [
            { type: "CONTRACT", count: 3 },
            { type: "PARTNER", count: 3 },
            { type: "DIRECT_OBLIGATION", count: 1 }
        ]
    },
    budget_lines: {
        total: 15,
        types: [
            { type: "DRAFT", count: 2 },
            { type: "PLANNED", count: 6 },
            { type: "IN_EXECUTION", count: 4 },
            { type: "OBLIGATED", count: 3 }
        ]
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
        spendingData: sampleSpendingData,
        counts: sampleCounts
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
        spendingData: null,
        counts: null
    }
};
