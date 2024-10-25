import PropTypes from "prop-types";
import StatusTagList from "../../UI/Tag/StatusTagList";
import Card from "../../UI/Cards/Card";

/**
 * A component that displays the total budget lines for an agreement.
 * @component
 * @param {Object} props - The component props.
 * @param {number} props.numberOfAgreements - The number of agreements.
 * @param {Object} props.countsByStatus - The counts of agreements by status.
 * @param {boolean} props.includeDrafts - Include draft BLIs
 * @returns {JSX.Element} - The agreement total budget lines card component JSX.
 */
const AgreementTotalBudgetLinesCard = ({ numberOfAgreements = 0, countsByStatus = {}, includeDrafts }) => {
    const headerText = "Total Budget Lines";

    return (
        <Card>
            <article data-cy="agreement-total-budget-lines-card-article">
                <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">{headerText}</h3>
                <div className="display-flex flex-justify width-fit-content">
                    <span
                        className="font-sans-xl text-bold line-height-sans-1"
                        data-cy="number-of-agreements"
                    >
                        {numberOfAgreements}
                    </span>
                    <div className="display-flex flex-column margin-left-105 grid-gap">
                        <StatusTagList
                            countsByStatus={countsByStatus}
                            includeDrafts={includeDrafts}
                        />
                    </div>
                </div>
            </article>
        </Card>
    );
};

AgreementTotalBudgetLinesCard.propTypes = {
    numberOfAgreements: PropTypes.number.isRequired,
    countsByStatus: PropTypes.object.isRequired,
    includeDrafts: PropTypes.bool.isRequired
};

export default AgreementTotalBudgetLinesCard;
