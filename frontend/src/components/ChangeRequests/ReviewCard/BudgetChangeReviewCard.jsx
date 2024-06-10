import PropTypes from "prop-types";
import ReviewCard from "./ReviewCard";
/**
 * BudgetChangeReviewCard component
 * @component
 * @param {Object} props - Properties passed to component
 * @param {number} props.agreementId - The name of the agreement
 * @param {string} props.requesterName - The name of the requester
 * @param {string} props.requestDate - The date of the request
 * @returns {JSX.Element} - The rendered component
 */
function BudgetChangeReviewCard({ agreementId, requesterName, requestDate }) {
    return (
        <ReviewCard
            type="Budget Change"
            agreementId={agreementId}
            actionIcons={true}
            requesterName={requesterName}
            requestDate={requestDate}
        >
            <p>Additional content</p>
        </ReviewCard>
    );
}

BudgetChangeReviewCard.propTypes = {
    agreementId: PropTypes.number.isRequired,
    requesterName: PropTypes.string.isRequired,
    requestDate: PropTypes.string.isRequired
};
export default BudgetChangeReviewCard;
