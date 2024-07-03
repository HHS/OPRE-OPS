import * as React from "react";
import PropTypes from "prop-types";
import { getInReviewChangeRequests } from "../../../helpers/changeRequests.helpers";
import DebugCode from "../../DebugCode";
import Accordion from "../../UI/Accordion";
import BudgetChangeReviewCard from "../BudgetChangeReviewCard";
import StatusChangeReviewCard from "../StatusChangeReviewCard";

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

    /**
     *  @typedef {import('../ChangeRequestsList/ChangeRequests').ChangeRequest} ChangeRequest
     *  @type {ChangeRequest[]}
     */

    return (
        <Accordion
            heading="Review Changes"
            level={2}
        >
            <h3>{changeType}</h3>
            <DebugCode data={changeRequestsInReview} />
            <p>
                {`This is a list of ${changeType}s on this agreement that need your approval. Approve or decline all
                ${changeType}s below or go back to the For Review Tab to approve or decline each change individually.`}
            </p>
            {changeRequestsInReview.map(
                /**
                 *  @param {ChangeRequest} changeRequest
                 */
                (changeRequest) => (
                    <React.Fragment key={changeRequest.id}>
                        {changeRequest.has_budget_change && changeType === "budget change" && (
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
                            />
                        )}
                        {changeRequest.has_status_change && changeType === "status change" && (
                            <StatusChangeReviewCard
                                key={changeRequest.id}
                                changeRequestId={changeRequest.id}
                                agreementId={changeRequest.agreement_id}
                                requestDate={changeRequest.created_on}
                                requesterName={changeRequest.created_by_user?.full_name}
                                bliId={changeRequest.budget_line_item_id}
                                changeTo={changeRequest.requested_change_diff}
                                handleReviewChangeRequest={() => {}}
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
