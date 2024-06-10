import { useGetChangeRequestsListQuery } from "../../../api/opsAPI";
import DebugCode from "../../DebugCode";
import BudgetChangeReviewCard from "../ReviewCard/BudgetChangeReviewCard";

function ChangeRequestsList() {
    const CHANGE_REQUEST_TYPES = {
        BUDGET: "budget_line_item_change_request",
        STATUS: "",
        BUDGET_DELETED: "",
        PRE_AWARD: "",
        PRE_AWARD_REQUISITION: "",
        AWARD_BUDGET_TEAM: ""
    };
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
                /**
                 *  @typedef {import('./ChangeRequests').ChangeRequest} ChangeRequest
                 *  @param {ChangeRequest} changeRequest
                 */
                (changeRequest) =>
                    changeRequest.type === CHANGE_REQUEST_TYPES.BUDGET && (
                        <BudgetChangeReviewCard
                            key={changeRequest.id}
                            agreementId={changeRequest.agreement_id}
                            requestDate={changeRequest.created_on}
                            requesterName={changeRequest.created_by_user?.full_name}
                        >
                            <p>Additional content</p>
                        </BudgetChangeReviewCard>
                    )
            )}
            <DebugCode data={changeRequests} />
        </>
    ) : (
        <p className="text-center margin-top-9">There are currently no changes for review.</p>
    );
}

export default ChangeRequestsList;
