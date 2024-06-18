import PropTypes from "prop-types";
import { convertCodeForDisplay, renderField } from "../../../helpers/utils";
import { useGetNameForCanId, useGetBLIStatus } from "../../../hooks/lookup.hooks";
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
function BudgetChangeReviewCard({ agreementId, requesterName, requestDate, bliId, changeTo }) {
    const KEY_NAMES = {
        AMOUNT: "amount",
        CAN: "can_id",
        DATE_NEEDED: "date_needed"
    };
    const keyName = Object.keys(changeTo)[0];
    let oldValue,
        newValue = "";

    const oldCan = useGetNameForCanId(changeTo.can_id?.old);
    const newCan = useGetNameForCanId(changeTo.can_id?.new);
    const status = useGetBLIStatus(bliId);

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
        default:
            break;
    }
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
                value={bliId}
            />
            <TermTag
                label="BL Status"
                bliStatus={status}
            />
            <TermTag
                label="Change To"
                value={convertCodeForDisplay("changeToTypes", keyName)}
            />
            <TermTag
                label="From"
                value={oldValue}
            />
            <TermTag
                label="To"
                value={newValue}
            />
        </ReviewCard>
    );
}

BudgetChangeReviewCard.propTypes = {
    agreementId: PropTypes.number.isRequired,
    requesterName: PropTypes.string.isRequired,
    requestDate: PropTypes.string.isRequired,
    bliId: PropTypes.number.isRequired,
    changeTo: PropTypes.object.isRequired
};
export default BudgetChangeReviewCard;
