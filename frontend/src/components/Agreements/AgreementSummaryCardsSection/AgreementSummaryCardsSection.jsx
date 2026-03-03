import AgreementCountSummaryCard from "../AgreementCountSummaryCard";
import AgreementSpendingSummaryCard from "../AgreementSpendingSummaryCard";

/**
 * AgreementSummaryCardsSection component
 * @component
 * @param {Object} props - Properties passed to component
 * @param {string|number} props.fiscalYear - The selected fiscal year
 * @param {Object} props.totals - Backend-computed aggregate totals across all filtered agreements
 * @returns {React.ReactElement} - The rendered component
 */
const AgreementSummaryCardsSection = ({ fiscalYear, totals }) => {
    const titlePrefix = fiscalYear === "Multi" ? "Multiple Years" : `${fiscalYear}`;

    const contractTotal = totals?.total_contract_amount ?? 0;
    const partnerTotal = totals?.total_partner_amount ?? 0;
    const grantTotal = totals?.total_grant_amount ?? 0;
    const directObligationTotal = totals?.total_direct_obligation_amount ?? 0;

    return (
        <div className="display-flex flex-justify">
            <AgreementCountSummaryCard
                title={`${titlePrefix} Agreements`}
                fiscalYear={titlePrefix}
                totals={totals}
            />
            <AgreementSpendingSummaryCard
                titlePrefix={titlePrefix}
                contractTotal={contractTotal}
                partnerTotal={partnerTotal}
                grantTotal={grantTotal}
                directObligationTotal={directObligationTotal}
            />
        </div>
    );
};

export default AgreementSummaryCardsSection;
