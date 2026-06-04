import PropTypes from "prop-types";
import ApprovalFlowReviewCard from "../ApprovalFlowReviewCard";

/**
 * PreAwardReviewCard component for displaying pending pre-award approval requests
 * from Division Directors.
 *
 * This is a thin wrapper around ApprovalFlowReviewCard that provides pre-award-specific
 * configuration (heading, navigation path, button text).
 *
 * @component
 * @param {Object} props - Properties passed to component
 * @param {number} props.agreementId - The ID of the agreement
 * @param {number} props.requestorId - The ID of the user who requested approval
 * @param {string} props.requestDate - The date of the approval request
 * @param {number} props.executingBliCount - Count of executing budget line items
 * @param {number} props.executingTotal - Total amount of executing budget line items
 * @param {string} [props.obligateByDate] - Earliest obligate-by date from executing BLIs
 * @param {number} props.agreementTotal - Total agreement amount
 * @param {string} [props.requestorNotes] - Notes from the requestor
 * @param {boolean} [props.isCondensed=false] - Whether the card is condensed
 * @param {boolean} [props.forceHover=false] - Whether to force hover state
 * @returns {JSX.Element} - The rendered component
 */
function PreAwardReviewCard(props) {
    return (
        <ApprovalFlowReviewCard
            {...props}
            headingText="Pre-Award"
            navigationPath="review-pre-award"
            dataCyPrefix="pre-award-review-card"
            buttonText="Review Agreement"
        />
    );
}

PreAwardReviewCard.propTypes = {
    agreementId: PropTypes.number.isRequired,
    requestorId: PropTypes.number.isRequired,
    requestDate: PropTypes.string.isRequired,
    executingBliCount: PropTypes.number.isRequired,
    executingTotal: PropTypes.number.isRequired,
    obligateByDate: PropTypes.string,
    agreementTotal: PropTypes.number.isRequired,
    requestorNotes: PropTypes.string,
    isCondensed: PropTypes.bool,
    forceHover: PropTypes.bool
};

export default PreAwardReviewCard;
