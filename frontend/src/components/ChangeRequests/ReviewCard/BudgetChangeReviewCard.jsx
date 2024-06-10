import PropTypes from "prop-types";
import ReviewCard from "./ReviewCard";
import TermTag from "./TermTag";
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
            <TermTag
                label="BL ID"
                value="12345"
            />
            <TermTag
                label="BL Status"
                value="Planned"
            />
            <TermTag
                label="Change To"
                value="Amount"
            />
            <TermTag
                label="From"
                value="$1,000.00"
            />
            <TermTag
                label="To"
                value="$2,000.00"
            />
        </ReviewCard>
    );
}

BudgetChangeReviewCard.propTypes = {
    agreementId: PropTypes.number.isRequired,
    requesterName: PropTypes.string.isRequired,
    requestDate: PropTypes.string.isRequired
};
export default BudgetChangeReviewCard;
