import AgreementFYSpendingSummaryCard from "../AgreementFYSpendingSummaryCard";
import AgreementTypeSummaryCard from "../AgreementTypeSummaryCard";

/**
 * AgreementSummaryCardsSection component
 * @component
 * @param {Object} props - Properties passed to component
 * @param {string|number} props.fiscalYear - The selected fiscal year
 * @returns {React.ReactElement} - The rendered component
 */
const AgreementSummaryCardsSection = ({ fiscalYear }) => {
    const titlePrefix = fiscalYear === "Multi" ? "Multiple Years" : `FY ${fiscalYear}`;

    return (
        <div className="display-flex flex-justify">
            <AgreementTypeSummaryCard titlePrefix={titlePrefix} />
            <AgreementFYSpendingSummaryCard
                title={`${titlePrefix} Agreements Total`}
                totalAmount={0}
            />
        </div>
    );
};

export default AgreementSummaryCardsSection;
