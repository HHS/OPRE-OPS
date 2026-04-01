import PropTypes from "prop-types";
import Accordion from "../../UI/Accordion/Accordion";
import BudgetLineTotalSummaryCard from "../BudgetLinesTotalSummaryCard/BudgetLinesTotalSummaryCard";

/**
 * ReviewExecutingTotalAccordion component
 * Displays the total amount of all executing budget lines in an accordion.
 * @component
 * @param {Object} props - Properties passed to component
 * @param {number} props.executingTotal - The total amount of executing budget lines
 * @param {string} [props.instructions] - Optional custom instructions text
 * @returns {JSX.Element} - The rendered component
 */
const ReviewExecutingTotalAccordion = ({
    executingTotal,
    instructions = "Review the total of all budget lines in Executing Status. This will be the amount of the Requisition Request from the Budget Team."
}) => {
    return (
        <Accordion
            heading="Review Executing Total"
            level={2}
        >
            <p>{instructions}</p>
            <div
                className="margin-top-3"
                style={{ maxWidth: "400px" }}
            >
                <BudgetLineTotalSummaryCard
                    title="Executing Total"
                    totalAmount={executingTotal}
                />
            </div>
        </Accordion>
    );
};

ReviewExecutingTotalAccordion.propTypes = {
    executingTotal: PropTypes.number.isRequired,
    instructions: PropTypes.string
};

export default ReviewExecutingTotalAccordion;
