import { AGREEMENT_TYPES } from "../../ServicesComponents/ServicesComponents.constants";
import { groupAndSortAgreementTypeCounts } from "../../../helpers/agreement.helpers";
import { convertCodeForDisplay } from "../../../helpers/utils";
import RoundedBox from "../../UI/RoundedBox";
import Tag from "../../UI/Tag";

/**
 * AgreementCountSummaryCard component
 * Displays the total number of agreements and a breakdown by agreement type,
 * along with counts for new and continuing agreements.
 * @component
 * @param {Object} props - Properties passed to component
 * @param {string} props.title - The heading for the card
 * @param {string} props.fiscalYear - The display string for the fiscal year (e.g. "FY 2025" or "All FYs")
 * @param {Object} props.totals - Backend-computed aggregate totals across all filtered agreements
 * @returns {JSX.Element} - The rendered component
 */
const agreementTypeStyles = {
    CONTRACT: { backgroundColor: "var(--data-viz-agreement-contract)", color: "white" },
    GRANT: { backgroundColor: "var(--data-viz-agreement-grant)", color: "black" },
    DIRECT_OBLIGATION: { backgroundColor: "var(--data-viz-agreement-direct-obligation)", color: "white" },
    [AGREEMENT_TYPES.PARTNER]: { backgroundColor: "var(--data-viz-agreement-partner)", color: "black" }
};

const convertTypeCountsObjToArray = (countsObj) => {
    return groupAndSortAgreementTypeCounts(Object.entries(countsObj).map(([type, count]) => ({ type, count })));
};

const AgreementCountSummaryCard = ({ title, fiscalYear, totals }) => {
    const totalCount = totals?.total_agreements_count ?? 0;
    const typeCounts = totals?.type_counts ? convertTypeCountsObjToArray(totals.type_counts) : [];

    const newCount = totals?.new_count ?? 0;
    const newTypeCounts = totals?.new_type_counts ? convertTypeCountsObjToArray(totals.new_type_counts) : [];

    const continuingCount = totals?.continuing_count ?? 0;
    const continuingTypeCounts = totals?.continuing_type_counts
        ? convertTypeCountsObjToArray(totals.continuing_type_counts)
        : [];

    return (
        <RoundedBox
            id="agreement-count-summary-card"
            dataCy="agreement-count-summary-card"
        >
            <div className="display-flex flex-justify">
                <article>
                    <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">{title}</h3>
                    <div>
                        <span className="font-sans-xl text-bold line-height-sans-1">{totalCount}</span>
                        <div className="display-flex flex-column flex-align-start grid-gap margin-top-1">
                            {typeCounts.map(({ type, count }, index) => (
                                <Tag
                                    key={type}
                                    className={`${index > 0 ? "margin-top-1" : ""}`}
                                    style={agreementTypeStyles[type]}
                                    text={`${count} ${type === AGREEMENT_TYPES.PARTNER ? "Partner" : convertCodeForDisplay("agreementType", type)}`}
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
                        <span className="font-sans-xl text-bold line-height-sans-1">{newCount}</span>
                        <div className="display-flex flex-column flex-align-start grid-gap margin-top-1">
                            {newTypeCounts.map(({ type, count }, index) => (
                                <Tag
                                    key={type}
                                    tagStyle="primaryDarkTextLightBackground"
                                    className={`${index > 0 ? "margin-top-1" : ""}`}
                                    text={`${count} ${type === AGREEMENT_TYPES.PARTNER ? "Partner" : convertCodeForDisplay("agreementType", type)}`}
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
                        <span className="font-sans-xl text-bold line-height-sans-1">{continuingCount}</span>
                        <div className="display-flex flex-column flex-align-start grid-gap margin-top-1">
                            {continuingTypeCounts.map(({ type, count }, index) => (
                                <Tag
                                    key={type}
                                    tagStyle="primaryDarkTextLightBackground"
                                    className={`${index > 0 ? "margin-top-1" : ""}`}
                                    text={`${count} ${type === AGREEMENT_TYPES.PARTNER ? "Partner" : convertCodeForDisplay("agreementType", type)}`}
                                />
                            ))}
                        </div>
                    </div>
                </article>
            </div>
        </RoundedBox>
    );
};

export default AgreementCountSummaryCard;
