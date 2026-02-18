import RoundedBox from "../../UI/RoundedBox";

/**
 * Renders a summary card that displays agreements by type.
 * @component
 * @param {Object} props - The props that were defined by the caller of this component.
 * @param {string} props.titlePrefix - The prefix for the title, typically indicating the fiscal year
 * @returns {React.ReactElement} - A React component that displays the agreement type summary card.
 */
const AgreementTypeSummaryCard = ({ titlePrefix }) => {
    return (
        <RoundedBox
            dataCy="agreement-type-summary-card"
            style={{ padding: "20px 0 20px 30px" }}
        >
            <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">{`${titlePrefix} Agreements By Type`}</h3>

            <div className="display-flex flex-justify">
                <div
                    className="font-12px"
                    style={{ minWidth: "230px" }}
                >
                    {/* TODO: Add agreement type legend items here */}
                </div>
                <div
                    id="agreement-type-chart"
                    className="width-card height-card margin-top-neg-1"
                    aria-label="This is a Donut Chart that displays the percent by agreement type in the center."
                    role="img"
                >
                    {/* TODO: Add donut chart here */}
                </div>
            </div>
        </RoundedBox>
    );
};

export default AgreementTypeSummaryCard;
