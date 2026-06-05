import PortfolioBudgetSummary from "./PortfolioBudgetSummary";

const buildItemCounts = (entries) => entries.filter(([, count]) => count > 0).map(([type, count]) => ({ type, count }));

const fundingControl = (category) => ({
    control: { type: "number", min: 0, step: 100_000 },
    table: { category }
});

const countControl = (category) => ({
    control: { type: "number", min: 0, step: 1 },
    table: { category }
});

export default {
    title: "Features/Portfolios/PortfolioBudgetSummary",
    component: PortfolioBudgetSummary,
    decorators: [
        (Story) => (
            <>
                {/* CSS module `width: 29.125rem` on RoundedBox wins over USWDS `width-full`
                    in Storybook's dev-mode cascade. Override by targeting the hardcoded id. */}
                <style>{"#big-budget-summary-card { width: 100% !important; }"}</style>
                <Story />
            </>
        )
    ],
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
        fiscalYear: { control: { type: "number" }, table: { category: "General" } },
        totalFunding: fundingControl("Funding"),
        inDraftFunding: fundingControl("Funding"),
        plannedFunding: fundingControl("Funding"),
        inExecutionFunding: fundingControl("Funding"),
        obligatedFunding: fundingControl("Funding"),
        researchProjectCount: countControl("Project Counts"),
        adminSupportProjectCount: countControl("Project Counts"),
        contractAgreementCount: countControl("Agreement Counts"),
        grantAgreementCount: countControl("Agreement Counts"),
        directObligationAgreementCount: countControl("Agreement Counts"),
        iaaAgreementCount: countControl("Agreement Counts"),
        aaAgreementCount: countControl("Agreement Counts"),
        miscellaneousAgreementCount: countControl("Agreement Counts"),
        partnerAgreementCount: countControl("Agreement Counts"),
        draftBudgetLineCount: countControl("Budget Line Counts"),
        plannedBudgetLineCount: countControl("Budget Line Counts"),
        inExecutionBudgetLineCount: countControl("Budget Line Counts"),
        obligatedBudgetLineCount: countControl("Budget Line Counts")
    },
    render: (args) => (
        <PortfolioBudgetSummary
            fiscalYear={args.fiscalYear}
            totalFunding={args.totalFunding}
            inDraftFunding={args.inDraftFunding}
            plannedFunding={args.plannedFunding}
            inExecutionFunding={args.inExecutionFunding}
            obligatedFunding={args.obligatedFunding}
            projectTypesCount={buildItemCounts([
                ["RESEARCH", args.researchProjectCount],
                ["ADMINISTRATIVE_AND_SUPPORT", args.adminSupportProjectCount]
            ])}
            agreementTypesCount={buildItemCounts([
                ["CONTRACT", args.contractAgreementCount],
                ["GRANT", args.grantAgreementCount],
                ["DIRECT_OBLIGATION", args.directObligationAgreementCount],
                ["IAA", args.iaaAgreementCount],
                ["AA", args.aaAgreementCount],
                ["MISCELLANEOUS", args.miscellaneousAgreementCount],
                ["PARTNER", args.partnerAgreementCount]
            ])}
            budgetLineTypesCount={buildItemCounts([
                ["DRAFT", args.draftBudgetLineCount],
                ["PLANNED", args.plannedBudgetLineCount],
                ["IN_EXECUTION", args.inExecutionBudgetLineCount],
                ["OBLIGATED", args.obligatedBudgetLineCount]
            ])}
        />
    )
};

export const Populated = {
    args: {
        fiscalYear: 2025,
        totalFunding: 8_000_000,
        inDraftFunding: 500_000,
        plannedFunding: 2_000_000,
        inExecutionFunding: 1_500_000,
        obligatedFunding: 1_000_000,
        researchProjectCount: 4,
        adminSupportProjectCount: 2,
        contractAgreementCount: 5,
        grantAgreementCount: 3,
        directObligationAgreementCount: 1,
        iaaAgreementCount: 0,
        aaAgreementCount: 0,
        miscellaneousAgreementCount: 0,
        partnerAgreementCount: 0,
        draftBudgetLineCount: 2,
        plannedBudgetLineCount: 6,
        inExecutionBudgetLineCount: 4,
        obligatedBudgetLineCount: 3
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
        researchProjectCount: 0,
        adminSupportProjectCount: 0,
        contractAgreementCount: 0,
        grantAgreementCount: 0,
        directObligationAgreementCount: 0,
        iaaAgreementCount: 0,
        aaAgreementCount: 0,
        miscellaneousAgreementCount: 0,
        partnerAgreementCount: 0,
        draftBudgetLineCount: 0,
        plannedBudgetLineCount: 0,
        inExecutionBudgetLineCount: 0,
        obligatedBudgetLineCount: 0
    }
};
