import PropTypes from "prop-types";
import ApprovalFlowReviewCard from "../ApprovalFlowReviewCard";

/**
 * BudgetTeamRequisitionReviewCard component for displaying pending budget team requisition reviews.
 * Appears after Division Director approval, prompts budget team to enter requisition details.
 *
 * This is a thin wrapper around ApprovalFlowReviewCard that provides budget-team-specific
 * configuration (heading with line break, navigation path, button text).
 *
 * @component
 * @param {Object} props - Properties passed to component
 * @param {number} props.agreementId - The ID of the agreement
 * @param {number} props.requestorId - The ID of the user who requested pre-award approval
 * @param {string} props.requestDate - The date of the approval request
 * @param {number} props.executingBliCount - Count of EXECUTING budget line items
 * @param {number} props.executingTotal - Sum of executing budget line items
 * @param {string} [props.obligateByDate] - Date by which funds must be obligated
 * @param {number} props.agreementTotal - Total agreement value
 * @param {boolean} [props.isCondensed=false] - Whether the card is condensed
 * @param {boolean} [props.forceHover=false] - Whether to force hover state
 * @returns {JSX.Element} - The rendered component
 */
function BudgetTeamRequisitionReviewCard(props) {
    return (
        <ApprovalFlowReviewCard
            {...props}
            headingText={
                <>
                    Pre-Award Requisition
                    <br />
                    Review
                </>
            }
            navigationPath="review-budget-requisition"
            dataCyPrefix="budget-team-requisition-review-card"
            buttonText="Review Agreement"
        />
    );
}

BudgetTeamRequisitionReviewCard.propTypes = {
    agreementId: PropTypes.number.isRequired,
    requestorId: PropTypes.number.isRequired,
    requestDate: PropTypes.string.isRequired,
    executingBliCount: PropTypes.number.isRequired,
    executingTotal: PropTypes.number.isRequired,
    obligateByDate: PropTypes.string,
    agreementTotal: PropTypes.number.isRequired,
    isCondensed: PropTypes.bool,
    forceHover: PropTypes.bool
};

export default BudgetTeamRequisitionReviewCard;
