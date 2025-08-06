import * as React from "react";
import { BLI_STATUS } from "../../../helpers/budgetLines.helpers";
import Accordion from "../../UI/Accordion";
import BudgetChangeReviewCard from "../BudgetChangeReviewCard";
import { CHANGE_REQUEST_TYPES } from "../ChangeRequests.constants";
import ProcurementShopReviewCard from "../ProcurementShopReviewCard";
import StatusChangeReviewCard from "../StatusChangeReviewCard";

/**
 *  @typedef {import('../../../types/ChangeRequestsTypes').ChangeRequest} ChangeRequest
 *  @type {ChangeRequest[]}
 */
/**
 * A component that displays review change requests.
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.changeType - The type of change request.
 * @param {string} props.changeRequestTitle - The displayed title case of change request formatted
 * @param {string} [props.statusChangeTo=""] - The status change to. - optional
 * @param {ChangeRequest[]} props.changeRequests - The budget lines in review.
 * @returns {React.ReactElement} - The rendered component.
 */
function ReviewChangeRequestAccordion({ changeType, changeRequests, changeRequestTitle, statusChangeTo = "" }) {
    const changeRequestStatus = statusChangeTo === "EXECUTING" ? BLI_STATUS.EXECUTING : BLI_STATUS.PLANNED;

    return (
        <Accordion
            heading="Review Changes"
            level={2}
        >
            <p>
                {`This is a list of ${statusChangeTo.toLowerCase()} ${changeRequestTitle.toLowerCase()}s on this agreement that need your approval. Approve or decline all
                ${changeRequestTitle.toLowerCase()}s below or go back to the For Review Tab to approve or decline each change individually.`}
            </p>
            {changeRequests.map(
                /** @param {ChangeRequest} changeRequest */
                (changeRequest) => (
                    <React.Fragment key={changeRequest.id}>
                        {changeRequest.has_proc_shop_change && (
                            <ProcurementShopReviewCard
                                changeRequestId={changeRequest.id}
                                agreementId={changeRequest.agreement_id}
                                requesterName={changeRequest.created_by_user.full_name}
                                requestDate={changeRequest.created_on}
                                handleReviewChangeRequest={() => {}}
                                oldAwardingEntityId={changeRequest.requested_change_diff.awarding_entity_id?.old ?? -1}
                                newAwardingEntityId={changeRequest.requested_change_diff.awarding_entity_id?.new ?? -1}
                                isCondensed={true}
                                forceHover={true}
                            />
                        )}
                        {changeRequest.has_budget_change && changeType === CHANGE_REQUEST_TYPES.BUDGET && (
                            <BudgetChangeReviewCard
                                changeRequestId={changeRequest.id}
                                agreementId={changeRequest.agreement_id}
                                requestDate={changeRequest.created_on}
                                requesterName={changeRequest.created_by_user?.full_name}
                                bliId={changeRequest.budget_line_item_id ?? -1}
                                changeTo={changeRequest.requested_change_diff}
                                handleReviewChangeRequest={() => {}}
                                isCondensed={true}
                                forceHover={true}
                            />
                        )}
                        {changeRequest.has_status_change &&
                            changeType === CHANGE_REQUEST_TYPES.STATUS &&
                            changeRequest.requested_change_data.status === changeRequestStatus && (
                                <StatusChangeReviewCard
                                    changeRequestId={changeRequest.id}
                                    agreementId={changeRequest.agreement_id}
                                    requestDate={changeRequest.created_on}
                                    requesterName={changeRequest.created_by_user?.full_name}
                                    bliId={changeRequest.budget_line_item_id ?? -1}
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

export default ReviewChangeRequestAccordion;
