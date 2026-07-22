import * as React from "react";
import { useState } from "react";
import { useSelector } from "react-redux";
import {
    useGetChangeRequestsListQuery,
    useGetPendingPreAwardApprovalsQuery,
    useGetPendingBudgetRequisitionsQuery
} from "../../../api/opsAPI";
import BudgetChangeReviewCard from "../BudgetChangeReviewCard";
import ProcurementShopReviewCard from "../ProcurementShopReviewCard";
import StatusChangeReviewCard from "../StatusChangeReviewCard";
import PreAwardReviewCard from "../PreAwardReviewCard";
import BudgetTeamRequisitionReviewCard from "../BudgetTeamRequisitionReviewCard";
import PaginationNav from "../../UI/PaginationNav/PaginationNav";
import { useNavigate } from "react-router-dom";

const BLI_STATUS_IN_EXECUTION = "In Execution";
const PAGE_SIZE = 10;

/**
 * @component Change Requests List component.
 * @typedef {import("../../../types/ChangeRequestsTypes").ChangeRequest} ChangeRequest
 * @param {Object} props
 * @param {Function} props.handleReviewChangeRequest - Function to handle review of change requests
 * @returns {React.ReactElement} - The rendered component
 */
function ChangeRequestsList({ handleReviewChangeRequest }) {
    const navigate = useNavigate();
    const userId = useSelector((state) => state.auth?.activeUser?.id) ?? null;
    const [currentPage, setCurrentPage] = useState(1); // 1-indexed for UI

    /** @type {{data?: {data: ChangeRequest[], count: number, limit: number, offset: number} | undefined, isError: boolean, isLoading: boolean}} */
    const {
        data: changeRequestsResponse,
        isLoading: loadingChangeRequests,
        isError: errorChangeRequests
    } = useGetChangeRequestsListQuery(
        { userId, limit: PAGE_SIZE, offset: (currentPage - 1) * PAGE_SIZE },
        { skip: !userId, refetchOnMountOrArgChange: true }
    );
    const changeRequests = changeRequestsResponse?.data;
    const totalCount = changeRequestsResponse?.count || 0;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    // Fetch pending pre-award approvals
    const {
        data: preAwardApprovals,
        isLoading: loadingPreAwardApprovals,
        isError: errorPreAwardApprovals
    } = useGetPendingPreAwardApprovalsQuery(undefined, { refetchOnMountOrArgChange: true });

    // Fetch pending budget team requisitions
    const {
        data: budgetRequisitions,
        isLoading: loadingBudgetRequisitions,
        isError: errorBudgetRequisitions
    } = useGetPendingBudgetRequisitionsQuery(undefined, { refetchOnMountOrArgChange: true });

    const calculateExecutingTotal = (budgetLineItems = []) => {
        return budgetLineItems
            .filter((bli) => bli.status === BLI_STATUS_IN_EXECUTION)
            .reduce((sum, bli) => sum + (bli.amount || 0), 0);
    };

    const calculateExecutingBliCount = (budgetLineItems = []) => {
        return budgetLineItems.filter((bli) => bli.status === BLI_STATUS_IN_EXECUTION).length;
    };

    const getObligateByDate = (budgetLineItems = []) => {
        const executingBlis = budgetLineItems.filter(
            (bli) => bli.status === BLI_STATUS_IN_EXECUTION && bli.date_needed
        );
        if (executingBlis.length === 0) return null;
        const dates = executingBlis.map((bli) => new Date(bli.date_needed));
        return new Date(Math.min(...dates)).toISOString().split("T")[0];
    };

    // Handle navigation to error page in useEffect to avoid setState during render
    React.useEffect(() => {
        if (errorChangeRequests || errorPreAwardApprovals || errorBudgetRequisitions) {
            navigate("/error");
        }
    }, [errorChangeRequests, errorPreAwardApprovals, errorBudgetRequisitions, navigate]);

    if (loadingChangeRequests || loadingPreAwardApprovals || loadingBudgetRequisitions) {
        return <h1>Loading...</h1>;
    }
    if (errorChangeRequests || errorPreAwardApprovals || errorBudgetRequisitions) {
        return null;
    }

    const hasChangeRequests = changeRequests && changeRequests.length > 0;
    const hasPreAwardApprovals = preAwardApprovals && preAwardApprovals.length > 0;
    const hasBudgetRequisitions = budgetRequisitions && budgetRequisitions.length > 0;

    return hasChangeRequests || hasPreAwardApprovals || hasBudgetRequisitions ? (
        <>
            {/* Budget Team Requisition Cards */}
            {budgetRequisitions?.map((step) => (
                <BudgetTeamRequisitionReviewCard
                    key={`budget-requisition-${step.id}`}
                    agreementId={step.procurement_tracker?.agreement?.id}
                    requestorId={step.approval_requested_by}
                    requestDate={step.approval_requested_date}
                    executingBliCount={calculateExecutingBliCount(
                        step.procurement_tracker?.agreement?.budget_line_items ?? []
                    )}
                    executingTotal={calculateExecutingTotal(
                        step.procurement_tracker?.agreement?.budget_line_items ?? []
                    )}
                    obligateByDate={getObligateByDate(step.procurement_tracker?.agreement?.budget_line_items ?? [])}
                    agreementTotal={step.procurement_tracker?.agreement?.agreement_total ?? 0}
                />
            ))}

            {/* Pre-Award Approval Cards */}
            {preAwardApprovals?.map((step) => (
                <PreAwardReviewCard
                    key={`pre-award-${step.id}`}
                    agreementId={step.procurement_tracker?.agreement?.id}
                    requestorId={step.approval_requested_by}
                    requestDate={step.approval_requested_date}
                    executingBliCount={calculateExecutingBliCount(
                        step.procurement_tracker?.agreement?.budget_line_items ?? []
                    )}
                    executingTotal={calculateExecutingTotal(
                        step.procurement_tracker?.agreement?.budget_line_items ?? []
                    )}
                    obligateByDate={getObligateByDate(step.procurement_tracker?.agreement?.budget_line_items ?? [])}
                    agreementTotal={step.procurement_tracker?.agreement?.agreement_total ?? 0}
                />
            ))}

            {/* Change Request Cards */}
            {changeRequests?.map(
                /** @param {ChangeRequest} changeRequest */
                (changeRequest) => (
                    <React.Fragment key={changeRequest.id}>
                        {changeRequest.has_proc_shop_change && (
                            <>
                                <ProcurementShopReviewCard
                                    changeRequestId={changeRequest.id}
                                    agreementId={changeRequest.agreement_id}
                                    requesterName={
                                        changeRequest.created_by_user.display_name ??
                                        changeRequest.created_by_user.full_name
                                    }
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
                        {(changeRequest.has_budget_change || changeRequest.has_delete_change) && (
                            <BudgetChangeReviewCard
                                key={changeRequest.id}
                                changeRequestId={changeRequest.id}
                                agreementId={changeRequest.agreement_id}
                                requestDate={changeRequest.created_on}
                                requesterName={
                                    changeRequest.created_by_user?.display_name ??
                                    changeRequest.created_by_user?.full_name
                                }
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
                                requesterName={
                                    changeRequest.created_by_user?.display_name ??
                                    changeRequest.created_by_user?.full_name
                                }
                                bliId={changeRequest.budget_line_item_id ?? 0}
                                changeTo={changeRequest.requested_change_diff}
                                handleReviewChangeRequest={handleReviewChangeRequest}
                            />
                        )}
                    </React.Fragment>
                )
            )}

            {totalPages > 1 && (
                <div className="margin-top-3">
                    <PaginationNav
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        totalPages={totalPages}
                    />
                </div>
            )}
        </>
    ) : (
        <p className="text-center margin-top-9">There are currently no changes for review.</p>
    );
}

export default ChangeRequestsList;
