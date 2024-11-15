import PropTypes from "prop-types";
import * as React from "react";
import { useGetChangeRequestsListQuery } from "../../../api/opsAPI";
import BudgetChangeReviewCard from "../BudgetChangeReviewCard";
import StatusChangeReviewCard from "../StatusChangeReviewCard";

/**
 * @component Change Requests List component.
 * @typedef {import("../ChangeRequestsTypes").ChangeRequest} ChangeRequest
 * @param {Object} props
 * @param {Function} props.handleReviewChangeRequest - Function to handle review of change requests
 * @returns {JSX.Element} - The rendered component
 */
function ChangeRequestsList({ handleReviewChangeRequest }) {
    const {
        data: changeRequests,
        isLoading: loadingChangeRequests,
        isError: errorChangeRequests
    } = useGetChangeRequestsListQuery({ refetchOnMountOrArgChange: true });

    if (loadingChangeRequests) {
        return <h1>Loading...</h1>;
    }
    if (errorChangeRequests) {
        return <h1>Oops, an error occurred</h1>;
    }

    return changeRequests.length > 0 ? (
        <>
            {changeRequests.map(
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

ChangeRequestsList.propTypes = {
    handleReviewChangeRequest: PropTypes.func.isRequired
};
export default ChangeRequestsList;
