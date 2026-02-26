import { convertCodeForDisplay } from "../../../helpers/utils";
import RoundedBox from "../../UI/RoundedBox";
import Tag from "../../UI/Tag";

/**
 * AgreementFYSpendingSummaryCard component
 * Displays the total number of agreements and a breakdown by agreement type.
 * @component
 * @param {Object} props - Properties passed to component
 * @param {string} props.title - The heading for the card
 * @param {string} props.fiscalYear - The display string for the fiscal year (e.g. "FY 2025" or "All FYs")
 * @param {import("../../../types/AgreementTypes").Agreement[]} props.agreements - The list of agreements
 * @returns {JSX.Element} - The rendered component
 */
const AgreementFYSpendingSummaryCard = ({ title, fiscalYear, agreements = [] }) => {
    const totalCount = agreements.length;

    const countsByType = agreements.reduce((acc, agreement) => {
        const type = agreement.agreement_type;
        if (type) {
            acc[type] = (acc[type] || 0) + 1;
        }
        return acc;
    }, {});

    const typeCounts = Object.entries(countsByType).map(([type, count]) => ({ type, count }));

    return (
        <RoundedBox
            id="agreement-fy-spending-summary-card"
            dataCy="agreement-fy-spending-summary-card"
        >
            <div className="display-flex flex-justify">
                <article>
                    <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">{title}</h3>
                    <div>
                        <span className="font-sans-xl text-bold line-height-sans-1">{totalCount}</span>
                        <div className="display-flex flex-column grid-gap margin-top-1">
                            {typeCounts.map(({ type, count }, index) => (
                                <Tag
                                    key={type}
                                    className={`bg-brand-primary-light text-brand-primary-dark ${index > 0 ? "margin-top-1" : ""}`}
                                    text={`${count} ${convertCodeForDisplay("agreementType", type)}`}
                                />
                            ))}
                        </div>
                    </div>
                </article>

                <article>
                    <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">
                        {`${fiscalYear} New`}
                    </h3>
                </article>

                <article>
                    <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">
                        {`${fiscalYear} Continuing`}
                    </h3>
                </article>
            </div>
        </RoundedBox>
    );
};

export default AgreementFYSpendingSummaryCard;
