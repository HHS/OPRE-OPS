import AgreementSpendingCards from "./AgreementSpendingCards";

export default {
    title: "Features/Agreements/AgreementSpendingCards",
    component: AgreementSpendingCards,
    parameters: {
        docs: {
            description: {
                component:
                    "Full-width spending summary card for an agreement type breakdown across new and " +
                    "continuing budget. Shows a `HorizontalStackedBar` with a per-segment legend when " +
                    "spending data is present, or an empty-state message when `total_spending` is zero or " +
                    "data is missing."
            }
        }
    },
    argTypes: {
        fiscalYear: { control: { type: "number" } }
    }
};

export const Populated = {
    args: {
        fiscalYear: 2025,
        spendingData: {
            total_spending: 5_100_000,
            agreement_types: [
                { type: "CONTRACT", total: 2_500_000, new: 1_500_000, continuing: 1_000_000 },
                { type: "PARTNER", total: 600_000, new: 400_000, continuing: 200_000 },
                { type: "GRANT", total: 1_500_000, new: 800_000, continuing: 700_000 },
                { type: "DIRECT_OBLIGATION", total: 500_000, new: 300_000, continuing: 200_000 }
            ]
        }
    }
};

export const Empty = {
    args: {
        fiscalYear: 2025,
        spendingData: { total_spending: 0, agreement_types: [] }
    }
};
