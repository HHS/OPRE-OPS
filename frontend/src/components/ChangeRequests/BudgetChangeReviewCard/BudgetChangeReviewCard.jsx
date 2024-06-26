import PropTypes from "prop-types";
import { renderChangeValues } from "../../../helpers/changeRequests.helpers";
import { convertCodeForDisplay } from "../../../helpers/utils";
import { useGetBLIStatus, useGetNameForCanId } from "../../../hooks/lookup.hooks";
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
    const keyName = Object.keys(changeTo)[0];

    const oldCan = useGetNameForCanId(changeTo.can_id?.old);
    const newCan = useGetNameForCanId(changeTo.can_id?.new);
    const status = useGetBLIStatus(bliId);
    const { oldValue, newValue } = renderChangeValues(keyName, changeTo, oldCan, newCan);

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