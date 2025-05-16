import * as React from "react";
import { useSelector } from "react-redux";
import { useGetChangeRequestsListQuery } from "../../../api/opsAPI";
import ErrorPage from "../../../pages/ErrorPage";
import BudgetChangeReviewCard from "../BudgetChangeReviewCard";
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
                        {changeRequest.has_budget_change && (
                            <BudgetChangeReviewCard
                                key={changeRequest.id}
                                changeRequestId={changeRequest.id}
                                agreementId={changeRequest.agreement_id}
                                requestDate={changeRequest.created_on}
                                requesterName={changeRequest.created_by_user?.full_name}
                                bliId={changeRequest.budget_line_item_id}
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
                                bliId={changeRequest.budget_line_item_id}
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
