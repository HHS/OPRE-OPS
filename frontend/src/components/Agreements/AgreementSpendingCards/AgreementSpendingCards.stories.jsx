import AgreementSpendingCards from "./AgreementSpendingCards";

const buildSpendingData = (args) => {
    const types = [
        {
            type: "CONTRACT",
            total: args.contractTotal,
            new: args.contractNew,
            continuing: args.contractContinuing
        },
        {
            type: "PARTNER",
            total: args.partnerTotal,
            new: args.partnerNew,
            continuing: args.partnerContinuing
        },
        {
            type: "GRANT",
            total: args.grantTotal,
            new: args.grantNew,
            continuing: args.grantContinuing
        },
        {
            type: "DIRECT_OBLIGATION",
            total: args.directObligationTotal,
            new: args.directObligationNew,
            continuing: args.directObligationContinuing
        }
    ];
    const agreement_types = types.filter((t) => t.total > 0);
    const total_spending = agreement_types.reduce((sum, t) => sum + t.total, 0);
    return { total_spending, agreement_types };
};

const amountControl = (category) => ({
    control: { type: "number", min: 0, step: 50_000 },
    table: { category }
});

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
        fiscalYear: { control: { type: "number" }, table: { category: "General" } },
        contractTotal: amountControl("Contract"),
        contractNew: amountControl("Contract"),
        contractContinuing: amountControl("Contract"),
        partnerTotal: amountControl("Partner"),
        partnerNew: amountControl("Partner"),
        partnerContinuing: amountControl("Partner"),
        grantTotal: amountControl("Grant"),
        grantNew: amountControl("Grant"),
        grantContinuing: amountControl("Grant"),
        directObligationTotal: amountControl("Direct Obligation"),
        directObligationNew: amountControl("Direct Obligation"),
        directObligationContinuing: amountControl("Direct Obligation")
    },
    render: (args) => (
        <AgreementSpendingCards
            fiscalYear={args.fiscalYear}
            spendingData={buildSpendingData(args)}
        />
    )
};

export const Populated = {
    args: {
        fiscalYear: 2025,
        contractTotal: 2_500_000,
        contractNew: 1_500_000,
        contractContinuing: 1_000_000,
        partnerTotal: 600_000,
        partnerNew: 400_000,
        partnerContinuing: 200_000,
        grantTotal: 1_500_000,
        grantNew: 800_000,
        grantContinuing: 700_000,
        directObligationTotal: 500_000,
        directObligationNew: 300_000,
        directObligationContinuing: 200_000
    }
};

export const Empty = {
    args: {
        fiscalYear: 2025,
        contractTotal: 0,
        contractNew: 0,
        contractContinuing: 0,
        partnerTotal: 0,
        partnerNew: 0,
        partnerContinuing: 0,
        grantTotal: 0,
        grantNew: 0,
        grantContinuing: 0,
        directObligationTotal: 0,
        directObligationNew: 0,
        directObligationContinuing: 0
    }
};
