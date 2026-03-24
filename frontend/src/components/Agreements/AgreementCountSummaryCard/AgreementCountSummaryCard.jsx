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
    Partner: { backgroundColor: "var(--data-viz-agreement-partner)", color: "black" }
};

const PARTNER_TYPES = ["AA", "IAA"];

/**
 * Converts a backend type counts object (e.g. {"CONTRACT": 3, "AA": 1, "IAA": 2})
 * into an array format [{type, count}] with AA+IAA grouped as "Partner".
 * @param {Object} countsObj - Object with type keys and count values
 * @returns {{type: string, count: number}[]}
 */
const TYPE_ORDER = ["CONTRACT", "Partner", "GRANT", "DIRECT_OBLIGATION"];

const convertTypeCountsObjToArray = (countsObj) => {
    const merged = {};
    for (const [type, count] of Object.entries(countsObj)) {
        const key = PARTNER_TYPES.includes(type) ? "Partner" : type;
        merged[key] = (merged[key] || 0) + count;
    }
    return TYPE_ORDER.filter((type) => type in merged).map((type) => ({ type, count: merged[type] }));
};

const AgreementCountSummaryCard = ({ title, fiscalYear, totals }) => {
    const totalCount = totals?.total_agreements_count ?? 0;
    const typeCounts = totals?.type_counts ? convertTypeCountsObjToArray(totals.type_counts) : [];

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

                {/* NOTE: New and Continuing counts display "TBD" because this data is not yet available in production. */}
                <article>
                    <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">
                        {`${fiscalYear} New`}
                    </h3>
                    <div>
                        <span className="font-sans-xl text-bold line-height-sans-1">TBD</span>
                    </div>
                </article>

                <article>
                    <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">
                        {`${fiscalYear} Continuing`}
                    </h3>
                    <div>
                        <span className="font-sans-xl text-bold line-height-sans-1">TBD</span>
                    </div>
                </article>
            </div>
        </RoundedBox>
    );
};

export default AgreementCountSummaryCard;
