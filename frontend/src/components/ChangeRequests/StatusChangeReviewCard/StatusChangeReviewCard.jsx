import PropTypes from "prop-types";
import { renderChangeValues } from "../../../helpers/changeRequests.helpers";
import { renderField } from "../../../helpers/utils";
import { useGetBLITotal, useGetNameForCanId } from "../../../hooks/lookup.hooks";
import ReviewCard from "../ReviewCard";
import TermTag from "../TermTag";

/**
 * BudgetChangeReviewCard component
 * @component
 * @param {Object} props - Properties passed to component
 * @param {number} props.changeRequestId - The ID of the change request
 * @param {number} props.agreementId - The name of the agreement
 * @param {string} props.requesterName - The name of the requester
 * @param {string} props.requestDate - The date of the request
 * @param {number} props.bliId - The budget line item ID
 * @param {Object} props.changeTo - The requested change
 * @returns {JSX.Element} - The rendered component
 */
function StatusChangeReviewCard({ changeRequestId, agreementId, requesterName, requestDate, bliId, changeTo }) {
    const keyName = Object.keys(changeTo)[0];
    const totalAmount = useGetBLITotal(bliId);
    const oldCan = useGetNameForCanId(changeTo.can_id?.old);
    const newCan = useGetNameForCanId(changeTo.can_id?.new);
    const { oldValue, newValue } = renderChangeValues(keyName, changeTo, oldCan, newCan);

    return (
        <ReviewCard
            changeRequestId={changeRequestId}
            type="Status Change"
            agreementId={agreementId}
            actionIcons={true}
            requesterName={requesterName}
            requestDate={requestDate}
        >
            <TermTag
                label="BL ID"
                value={bliId}
            />
            <TermTag
                label="Change To"
                value="Status"
            />
            <TermTag
                label="Total"
                value={renderField(null, "amount", totalAmount)}
            />
            <TermTag
                label="From"
                bliStatus={oldValue}
            />
            <TermTag
                label="To"
                bliStatus={newValue}
            />
        </ReviewCard>
    );
}

StatusChangeReviewCard.propTypes = {
    changeRequestId: PropTypes.number.isRequired,
    agreementId: PropTypes.number.isRequired,
    requesterName: PropTypes.string.isRequired,
    requestDate: PropTypes.string.isRequired,
    bliId: PropTypes.number.isRequired,
    changeTo: PropTypes.object.isRequired
};
export default StatusChangeReviewCard;
