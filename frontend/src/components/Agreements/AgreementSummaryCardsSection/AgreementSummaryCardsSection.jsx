import { getContractAgreementBLITotal, getPartnerAgreementBLITotal } from "../../../helpers/agreement.helpers";
import AgreementFYSpendingSummaryCard from "../AgreementFYSpendingSummaryCard";
import AgreementTypeSummaryCard from "../AgreementTypeSummaryCard";

/**
 * AgreementSummaryCardsSection component
 * @component
 * @param {Object} props - Properties passed to component
 * @param {string|number} props.fiscalYear - The selected fiscal year
 * @param {import("../../../types/AgreementTypes").Agreement[]} props.agreements - The list of agreements
 * @param {string} props.selectedFiscalYear - The selected fiscal year value (e.g. "2025" or "All")
 * @returns {React.ReactElement} - The rendered component
 */
const AgreementSummaryCardsSection = ({ fiscalYear, agreements = [], selectedFiscalYear }) => {
    const titlePrefix = fiscalYear === "Multi" ? "Multiple Years" : `${fiscalYear}`;

    const contractTotal = getContractAgreementBLITotal(agreements, Number(selectedFiscalYear));
    const partnerTotal = getPartnerAgreementBLITotal(agreements);

    return (
        <div className="display-flex flex-justify">
            <AgreementFYSpendingSummaryCard
                title={`${titlePrefix} Agreements`}
                fiscalYear={titlePrefix}
                agreements={agreements}
            />
            <AgreementTypeSummaryCard
                titlePrefix={titlePrefix}
                contractTotal={contractTotal}
                partnerTotal={partnerTotal}
            />
        </div>
    );
};

export default AgreementSummaryCardsSection;
