import PropTypes from "prop-types";
import { renderChangeValues } from "../../../helpers/changeRequests.helpers";
import { convertCodeForDisplay } from "../../../helpers/utils";
import { useGetBLIStatus, useGetNameForCanId } from "../../../hooks/lookup.hooks";
import { CHANGE_REQUEST_TYPES } from "../ChangeRequests.constants";
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
 * @param {Function} props.handleReviewChangeRequest - Function to handle review of change requests
 * @param {boolean} [props.isCondensed=false] - Whether the card is condensed
 * @param {boolean} [props.forceHover=false] - Whether to force hover state
 * @returns {JSX.Element} - The rendered component
 */
function BudgetChangeReviewCard({
    changeRequestId,
    agreementId,
    requesterName,
    requestDate,
    bliId,
    changeTo,
    handleReviewChangeRequest,
    isCondensed = false,
    forceHover = false
}) {
    const keyName = Object.keys(changeTo)[0];
    const oldCan = useGetNameForCanId(changeTo.can_id?.old);
    const newCan = useGetNameForCanId(changeTo.can_id?.new);
    const status = useGetBLIStatus(bliId);
    const { oldValue, newValue } = renderChangeValues(keyName, changeTo, oldCan, newCan);
    const changeMsg = `\u2022 BL ${bliId} ${convertCodeForDisplay("changeToTypes", keyName)}: ${oldValue} to ${newValue}`;

    return (
        <ReviewCard
            changeRequestId={changeRequestId}
            type={CHANGE_REQUEST_TYPES.BUDGET}
            agreementId={agreementId}
            actionIcons={true}
            requesterName={requesterName}
            requestDate={requestDate}
            handleReviewChangeRequest={handleReviewChangeRequest}
            changeMsg={changeMsg}
            isCondensed={isCondensed}
            forceHover={forceHover}
        >
            <TermTag
                label="BL ID"
                value={bliId}
                className="grid-col-1"
            />
            <TermTag
                label="BL Status"
                bliStatus={status}
                className="grid-col-2"
            />
            <TermTag
                label="Change To"
                value={convertCodeForDisplay("changeToTypes", keyName)}
                className="grid-col-2 margin-left-2"
            />
            <TermTag
                label="From"
                value={oldValue}
                className="grid-col-2"
            />
            <TermTag
                label="To"
                value={newValue}
                className="grid-col-2 margin-left-neg-2"
            />
        </ReviewCard>
    );
}

BudgetChangeReviewCard.propTypes = {
    changeRequestId: PropTypes.number.isRequired,
    agreementId: PropTypes.number.isRequired,
    requesterName: PropTypes.string.isRequired,
    requestDate: PropTypes.string.isRequired,
    bliId: PropTypes.number.isRequired,
    changeTo: PropTypes.object.isRequired,
    handleReviewChangeRequest: PropTypes.func.isRequired,
    isCondensed: PropTypes.bool,
    forceHover: PropTypes.bool
};
export default BudgetChangeReviewCard;
