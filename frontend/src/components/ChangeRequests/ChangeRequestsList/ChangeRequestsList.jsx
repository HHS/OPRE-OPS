import { useGetChangeRequestsListQuery } from "../../../api/opsAPI";
import DebugCode from "../../DebugCode";
import BudgetChangeReviewCard from "../ReviewCard/BudgetChangeReviewCard";
import StatusChangeReviewCard from "../ReviewCard/StatusChangeReviewCard";

function ChangeRequestsList() {
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

    /**
     *  @typedef {import('./ChangeRequests').ChangeRequest} ChangeRequest
     *  @type {ChangeRequest[]}
     */
    return changeRequests.length > 0 ? (
        <>
            {changeRequests.map(
                /**
                 *  @param {ChangeRequest} changeRequest
                 */
                (changeRequest) => (
                    <>
                        {changeRequest.has_budget_change && (
                            <BudgetChangeReviewCard
                                key={changeRequest.id}
                                agreementId={changeRequest.agreement_id}
                                requestDate={changeRequest.created_on}
                                requesterName={changeRequest.created_by_user?.full_name}
                                bliId={changeRequest.budget_line_item_id}
                                changeTo={changeRequest.requested_change_diff}
                            />
                        )}
                        {/* TODO: add Status Change Card */}
                        {changeRequest.has_status_change && (
                            <StatusChangeReviewCard
                                key={changeRequest.id}
                                agreementId={changeRequest.agreement_id}
                                requestDate={changeRequest.created_on}
                                requesterName={changeRequest.created_by_user?.full_name}
                                bliId={changeRequest.budget_line_item_id}
                                changeTo={changeRequest.requested_change_diff}
                            />
                        )}
                    </>
                )
            )}
            <DebugCode data={changeRequests} />
        </>
    ) : (
        <p className="text-center margin-top-9">There are currently no changes for review.</p>
    );
}

export default ChangeRequestsList;
