import PropTypes from "prop-types";
import * as React from "react";
import Accordion from "../../UI/Accordion";
import BudgetChangeReviewCard from "../BudgetChangeReviewCard";
import { CHANGE_REQUEST_TYPES } from "../ChangeRequests.constants";
import StatusChangeReviewCard from "../StatusChangeReviewCard";

/**
 *  @typedef {import('../ChangeRequestsList/ChangeRequests').ChangeRequest} ChangeRequest
 *  @type {ChangeRequest[]}
 */
/**
 * A component that displays review change requests.
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.changeType - The type of change request.
 * @param {ChangeRequest[]} props.changeRequests - The budget lines in review.
 * @param {string} [props.statusChangeTo=""] - The status change to. - optional
 * @returns {JSX.Element} - The rendered component.
 */
function ReviewChangeRequestAccordion({ changeType, changeRequests, statusChangeTo = "" }) {
    return (
        <Accordion
            heading="Review Changes"
            level={2}
        >
            <p>
                {`This is a list of ${statusChangeTo.toLowerCase()} ${changeType.toLowerCase()}s on this agreement that need your approval. Approve or decline all
                ${changeType.toLowerCase()}s below or go back to the For Review Tab to approve or decline each change individually.`}
            </p>
            {changeRequests.map(
                /**
                 *  @param {ChangeRequest} changeRequest
                 */
                (changeRequest) => (
                    <React.Fragment key={changeRequest.id}>
                        {changeRequest.has_budget_change && changeType === CHANGE_REQUEST_TYPES.BUDGET && (
                            <BudgetChangeReviewCard
                                key={changeRequest.id}
                                changeRequestId={changeRequest.id}
                                agreementId={changeRequest.agreement_id}
                                requestDate={changeRequest.created_on}
                                requesterName={changeRequest.created_by_user?.full_name}
                                bliId={changeRequest.budget_line_item_id}
                                changeTo={changeRequest.requested_change_diff}
                                handleReviewChangeRequest={() => {}}
                                isCondensed={true}
                                forceHover={true}
                            />
                        )}
                        {changeRequest.has_status_change && changeType === CHANGE_REQUEST_TYPES.STATUS && (
                            <StatusChangeReviewCard
                                key={changeRequest.id}
                                changeRequestId={changeRequest.id}
                                agreementId={changeRequest.agreement_id}
                                requestDate={changeRequest.created_on}
                                requesterName={changeRequest.created_by_user?.full_name}
                                bliId={changeRequest.budget_line_item_id}
                                changeTo={changeRequest.requested_change_diff}
                                handleReviewChangeRequest={() => {}}
                                isCondensed={true}
                                forceHover={true}
                            />
                        )}
                    </React.Fragment>
                )
            )}
        </Accordion>
    );
}

ReviewChangeRequestAccordion.propTypes = {
    changeType: PropTypes.string.isRequired,
    changeRequests: PropTypes.array.isRequired,
    statusChangeTo: PropTypes.string
};
export default ReviewChangeRequestAccordion;
