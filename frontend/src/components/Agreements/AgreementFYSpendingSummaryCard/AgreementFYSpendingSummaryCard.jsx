import { convertCodeForDisplay } from "../../../helpers/utils";
import RoundedBox from "../../UI/RoundedBox";
import Tag from "../../UI/Tag";

/**
 * AgreementFYSpendingSummaryCard component
 * Displays the total number of agreements and a breakdown by agreement type,
 * along with counts for new and continuing agreements.
 * @component
 * @param {Object} props - Properties passed to component
 * @param {string} props.title - The heading for the card
 * @param {string} props.fiscalYear - The display string for the fiscal year (e.g. "FY 2025" or "All FYs")
 * @param {import("../../../types/AgreementTypes").Agreement[]} props.agreements - The list of agreements
 * @returns {JSX.Element} - The rendered component
 */
const agreementTypeStyles = {
    CONTRACT: { backgroundColor: "var(--data-viz-agreement-contract)", color: "white" },
    GRANT: { backgroundColor: "var(--data-viz-agreement-grant)", color: "black" },
    DIRECT_OBLIGATION: { backgroundColor: "var(--data-viz-agreement-direct-obligation)", color: "white" },
    Partner: { backgroundColor: "var(--data-viz-agreement-partner)", color: "black" }
};

const PARTNER_TYPES = ["AA", "IAA"];

/**
 * Counts agreements by type, grouping partner types (AA, IAA) together.
 * @param {import("../../../types/AgreementTypes").Agreement[]} agreements
 * @returns {{type: string, count: number}[]}
 */
const getTypeCountsFromAgreements = (agreements) => {
    const countsByType = agreements.reduce((acc, agreement) => {
        const type = agreement.agreement_type;
        if (type) {
            const key = PARTNER_TYPES.includes(type) ? "Partner" : type;
            acc[key] = (acc[key] || 0) + 1;
        }
        return acc;
    }, {});

    return Object.entries(countsByType).map(([type, count]) => ({ type, count }));
};

const AgreementFYSpendingSummaryCard = ({ title, fiscalYear, agreements = [] }) => {
    const totalCount = agreements.length;
    const typeCounts = getTypeCountsFromAgreements(agreements);

    const newAgreements = agreements.filter((a) => a.award_type === "NEW");
    const continuingAgreements = agreements.filter((a) => a.award_type === "CONTINUING");

    const newTypeCounts = getTypeCountsFromAgreements(newAgreements);
    const continuingTypeCounts = getTypeCountsFromAgreements(continuingAgreements);

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
                                    className={`${index > 0 ? "margin-top-1" : ""}`}
                                    style={agreementTypeStyles[type]}
                                    text={`${count} ${type === "Partner" ? "Partner" : convertCodeForDisplay("agreementType", type)}`}
                                />
                            ))}
                        </div>
                    </div>
                </article>

                <article>
                    <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">
                        {`${fiscalYear} New`}
                    </h3>
                    <div>
                        <span className="font-sans-xl text-bold line-height-sans-1">{newAgreements.length}</span>
                        <div className="display-flex flex-column grid-gap margin-top-1">
                            {newTypeCounts.map(({ type, count }, index) => (
                                <Tag
                                    key={type}
                                    tagStyle="primaryDarkTextLightBackground"
                                    className={`${index > 0 ? "margin-top-1" : ""}`}
                                    text={`${count} ${type === "Partner" ? "Partner" : convertCodeForDisplay("agreementType", type)}`}
                                />
                            ))}
                        </div>
                    </div>
                </article>

                <article>
                    <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">
                        {`${fiscalYear} Continuing`}
                    </h3>
                    <div>
                        <span className="font-sans-xl text-bold line-height-sans-1">{continuingAgreements.length}</span>
                        <div className="display-flex flex-column grid-gap margin-top-1">
                            {continuingTypeCounts.map(({ type, count }, index) => (
                                <Tag
                                    key={type}
                                    tagStyle="primaryDarkTextLightBackground"
                                    className={`${index > 0 ? "margin-top-1" : ""}`}
                                    text={`${count} ${type === "Partner" ? "Partner" : convertCodeForDisplay("agreementType", type)}`}
                                />
                            ))}
                        </div>
                    </div>
                </article>
            </div>
        </RoundedBox>
    );
};

export default AgreementFYSpendingSummaryCard;
