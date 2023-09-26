import PropTypes from "prop-types";
import { StatusTagList } from "../../UI/Tag/StatusTag";
import SummaryCard from "../../UI/SummaryCard";

/**
 * A component that displays the total budget lines for an agreement.
 *
 * @param {Object} props - The component props.
 * @param {number} props.numberOfAgreements - The number of agreements.
 * @param {Object} props.countsByStatus - The counts of agreements by status.
 * @returns {React.JSX.Element} - The agreement total budget lines card component JSX.
 */
const AgreementTotalBudgetLinesCard = ({ numberOfAgreements = 0, countsByStatus = {} }) => {
    const headerText = "Total Budget Lines";

    return (
        <SummaryCard>
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
                        <StatusTagList countsByStatus={countsByStatus} />
                    </div>
                </div>
            </article>
        </SummaryCard>
    );
};

AgreementTotalBudgetLinesCard.propTypes = {
    numberOfAgreements: PropTypes.number.isRequired,
    countsByStatus: PropTypes.object.isRequired
};

export default AgreementTotalBudgetLinesCard;
