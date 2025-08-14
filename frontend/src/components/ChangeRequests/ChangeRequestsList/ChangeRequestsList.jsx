import * as React from "react";
import { useSelector } from "react-redux";
import { useGetChangeRequestsListQuery } from "../../../api/opsAPI";
import ErrorPage from "../../../pages/ErrorPage";
import BudgetChangeReviewCard from "../BudgetChangeReviewCard";
import ProcurementShopReviewCard from "../ProcurementShopReviewCard";
import StatusChangeReviewCard from "../StatusChangeReviewCard";

/**
 * @component Change Requests List component.
 * @typedef {import("../../../types/ChangeRequestsTypes").ChangeRequest} ChangeRequest
 * @param {Object} props
 * @param {Function} props.handleReviewChangeRequest - Function to handle review of change requests
 * @returns {React.ReactElement} - The rendered component
 */
function ChangeRequestsList({ handleReviewChangeRequest }) {
    const userId = useSelector((state) => state.auth?.activeUser?.id) ?? null;
    /** @type {{data?: ChangeRequest[] | undefined, isError: boolean, isLoading: boolean}} */
    const {
        data: changeRequests,
        isLoading: loadingChangeRequests,
        isError: errorChangeRequests
    } = useGetChangeRequestsListQuery({ refetchOnMountOrArgChange: true, userId });

    if (loadingChangeRequests) {
        return <h1>Loading...</h1>;
    }
    if (errorChangeRequests) {
        return <ErrorPage />;
    }

    return changeRequests && changeRequests.length > 0 ? (
        <>
            {changeRequests?.map(
                /** @param {ChangeRequest} changeRequest */
                (changeRequest) => (
                    <React.Fragment key={changeRequest.id}>
                        {/* TODO: may be better to use the has_proc_shop property if exposed */}
                        {changeRequest.change_request_type === "AGREEMENT_CHANGE_REQUEST" && (
                            <>
                                <ProcurementShopReviewCard
                                    changeRequestId={changeRequest.id}
                                    agreementId={changeRequest.agreement_id}
                                    requesterName={changeRequest.created_by_user.full_name}
                                    requestDate={changeRequest.created_on}
                                    handleReviewChangeRequest={handleReviewChangeRequest}
                                    oldAwardingEntityId={
                                        changeRequest?.requested_change_diff?.awarding_entity_id?.old ?? 0
                                    }
                                    newAwardingEntityId={
                                        changeRequest?.requested_change_diff?.awarding_entity_id?.new ?? 0
                                    }
                                />
                            </>
                        )}
                        {changeRequest.has_budget_change && (
                            <BudgetChangeReviewCard
                                key={changeRequest.id}
                                changeRequestId={changeRequest.id}
                                agreementId={changeRequest.agreement_id}
                                requestDate={changeRequest.created_on}
                                requesterName={changeRequest.created_by_user?.full_name}
                                bliId={changeRequest.budget_line_item_id ?? 0}
                                changeTo={changeRequest.requested_change_diff}
                                handleReviewChangeRequest={handleReviewChangeRequest}
                            />
                        )}
                        {changeRequest.has_status_change && (
                            <StatusChangeReviewCard
                                key={changeRequest.id}
                                changeRequestId={changeRequest.id}
                                agreementId={changeRequest.agreement_id}
                                requestDate={changeRequest.created_on}
                                requesterName={changeRequest.created_by_user?.full_name}
                                bliId={changeRequest.budget_line_item_id ?? 0}
                                changeTo={changeRequest.requested_change_diff}
                                handleReviewChangeRequest={handleReviewChangeRequest}
                            />
                        )}
                    </React.Fragment>
                )
            )}
        </>
    ) : (
        <p className="text-center margin-top-9">There are currently no changes for review.</p>
    );
}

export default ChangeRequestsList;
