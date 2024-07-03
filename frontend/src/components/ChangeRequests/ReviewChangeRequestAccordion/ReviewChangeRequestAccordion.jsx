import PropTypes from "prop-types";
import * as React from "react";
import { getInReviewChangeRequests } from "../../../helpers/changeRequests.helpers";
import DebugCode from "../../DebugCode";
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
 * @param {Object[]} props.budgetLinesInReview - The budget lines in review.
 * @returns {JSX.Element} - The rendered component.
 */
function ReviewChangeRequestAccordion({ changeType, budgetLinesInReview }) {
    const changeRequestsInReview = /** @type {ChangeRequest[]} */ (getInReviewChangeRequests(budgetLinesInReview));

    return (
        <Accordion
            heading="Review Changes"
            level={2}
        >
            <h3>{changeType}</h3>
            <DebugCode data={changeRequestsInReview} />
            <p>
                {`This is a list of ${changeType.toLowerCase()}s on this agreement that need your approval. Approve or decline all
                ${changeType.toLowerCase()}s below or go back to the For Review Tab to approve or decline each change individually.`}
            </p>
            {changeRequestsInReview.map(
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
    budgetLinesInReview: PropTypes.array.isRequired
};
export default ReviewChangeRequestAccordion;
