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
/** @typedef {import("../../../types/ProcurementTrackerTypes").ProcurementTrackerPreAwardStep} ProcurementTrackerPreAwardStep */

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
        { userId, limit: 1000, offset: 0 },
        { skip: !userId, refetchOnMountOrArgChange: true }
    );
    const changeRequests = changeRequestsResponse?.data ?? [];

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

    const taggedBudgetRequisitions = (budgetRequisitions ?? []).map((/** @type {ProcurementTrackerPreAwardStep} */ step) => ({
        _type: "budgetRequisition",
        _sortDate: step.approval_requested_date ?? "",
        item: step
    }));
    const taggedPreAwardApprovals = (preAwardApprovals ?? []).map((/** @type {ProcurementTrackerPreAwardStep} */ step) => ({
        _type: "preAward",
        _sortDate: step.approval_requested_date ?? "",
        item: step
    }));
    const taggedChangeRequests = changeRequests.map((cr) => ({
        _type: "changeRequest",
        _sortDate: cr.created_on ?? "",
        item: cr
    }));

    const allItems = [...taggedBudgetRequisitions, ...taggedPreAwardApprovals, ...taggedChangeRequests].sort(
        (a, b) => (b._sortDate > a._sortDate ? 1 : b._sortDate < a._sortDate ? -1 : 0)
    );

    const totalPages = Math.ceil(allItems.length / PAGE_SIZE);
    const pageItems = allItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    return allItems.length > 0 ? (
        <>
            {pageItems.map(({ _type, item }) => {
                if (_type === "budgetRequisition") {
                    return (
                        <BudgetTeamRequisitionReviewCard
                            key={`budget-requisition-${item.id}`}
                            agreementId={item.procurement_tracker?.agreement?.id}
                            requestorId={item.approval_requested_by}
                            requestDate={item.approval_requested_date}
                            executingBliCount={calculateExecutingBliCount(
                                item.procurement_tracker?.agreement?.budget_line_items ?? []
                            )}
                            executingTotal={calculateExecutingTotal(
                                item.procurement_tracker?.agreement?.budget_line_items ?? []
                            )}
                            obligateByDate={getObligateByDate(item.procurement_tracker?.agreement?.budget_line_items ?? []) ?? undefined}
                            agreementTotal={item.procurement_tracker?.agreement?.agreement_total ?? 0}
                        />
                    );
                }
                if (_type === "preAward") {
                    return (
                        <PreAwardReviewCard
                            key={`pre-award-${item.id}`}
                            agreementId={item.procurement_tracker?.agreement?.id}
                            requestorId={item.approval_requested_by}
                            requestDate={item.approval_requested_date}
                            executingBliCount={calculateExecutingBliCount(
                                item.procurement_tracker?.agreement?.budget_line_items ?? []
                            )}
                            executingTotal={calculateExecutingTotal(
                                item.procurement_tracker?.agreement?.budget_line_items ?? []
                            )}
                            obligateByDate={getObligateByDate(item.procurement_tracker?.agreement?.budget_line_items ?? []) ?? undefined}
                            agreementTotal={item.procurement_tracker?.agreement?.agreement_total ?? 0}
                            requestorNotes={item.requestor_notes}
                        />
                    );
                }
                // changeRequest — may render 1-3 cards per item
                /** @type {ChangeRequest} */
                const changeRequest = item;
                return (
                    <React.Fragment key={changeRequest.id}>
                        {changeRequest.has_proc_shop_change && (
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
                        )}
                        {changeRequest.has_budget_change && (
                            <BudgetChangeReviewCard
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
                );
            })}

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
