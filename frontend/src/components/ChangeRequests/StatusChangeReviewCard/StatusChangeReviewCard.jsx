import PropTypes from "prop-types";
import { renderField } from "../../../helpers/utils";
import { useGetBLITotal, useGetNameForCanId } from "../../../hooks/lookup.hooks";
import ReviewCard from "../ReviewCard";
import TermTag from "../TermTag";

/**
 * BudgetChangeReviewCard component
 * @component
 * @param {Object} props - Properties passed to component
 * @param {number} props.agreementId - The name of the agreement
 * @param {string} props.requesterName - The name of the requester
 * @param {string} props.requestDate - The date of the request
 * @param {number} props.bliId - The budget line item ID
 * @param {Object} props.changeTo - The requested change
 * @returns {JSX.Element} - The rendered component
 */
function StatusChangeReviewCard({ agreementId, requesterName, requestDate, bliId, changeTo }) {
    const KEY_NAMES = {
        AMOUNT: "amount",
        CAN: "can_id",
        DATE_NEEDED: "date_needed",
        STATUS: "status"
    };
    const keyName = Object.keys(changeTo)[0];
    let oldValue,
        newValue = "";
    const totalAmount = useGetBLITotal(bliId);
    const oldCan = useGetNameForCanId(changeTo.can_id?.old);
    const newCan = useGetNameForCanId(changeTo.can_id?.new);

    switch (keyName) {
        case KEY_NAMES.AMOUNT:
            oldValue = renderField(keyName, "amount", changeTo.amount.old);
            newValue = renderField(keyName, "amount", changeTo.amount.new);
            break;
        case KEY_NAMES.CAN:
            oldValue = oldCan;
            newValue = newCan;
            break;
        case KEY_NAMES.DATE_NEEDED:
            oldValue = renderField(keyName, "date_needed", changeTo.date_needed.old);
            newValue = renderField(keyName, "date_needed", changeTo.date_needed.new);
            break;
        case KEY_NAMES.STATUS:
            oldValue = renderField(keyName, "status", changeTo.status.old);
            newValue = renderField(keyName, "status", changeTo.status.new);
            break;
        default:
            break;
    }
    return (
        <ReviewCard
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
    agreementId: PropTypes.number.isRequired,
    requesterName: PropTypes.string.isRequired,
    requestDate: PropTypes.string.isRequired,
    bliId: PropTypes.number.isRequired,
    changeTo: PropTypes.object.isRequired
};
export default StatusChangeReviewCard;
