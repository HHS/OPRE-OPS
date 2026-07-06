import * as React from "react";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
    useGetChangeRequestsListQuery,
    useGetPendingPreAwardApprovalsQuery,
    useGetPendingBudgetRequisitionsQuery,
    useGetPendingAwardApprovalsQuery
} from "../../../api/opsAPI";
import BudgetChangeReviewCard from "../BudgetChangeReviewCard";
import ProcurementShopReviewCard from "../ProcurementShopReviewCard";
import StatusChangeReviewCard from "../StatusChangeReviewCard";
import PreAwardReviewCard from "../PreAwardReviewCard";
import BudgetTeamRequisitionReviewCard from "../BudgetTeamRequisitionReviewCard";
import AwardReviewCard from "../AwardReviewCard";
import PaginationNav from "../../UI/PaginationNav/PaginationNav";
import { useNavigate } from "react-router-dom";
/** @typedef {import("../../../types/ProcurementTrackerTypes").ProcurementTrackerPreAwardStep} ProcurementTrackerPreAwardStep */

const BLI_STATUS_IN_EXECUTION = "IN_EXECUTION";
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
    const changeRequestPageSize = 1000; // Should pretty much always be below 1000. Just using a large number to avoid needing to use backend paging.

    /** @type {{data?: {data: ChangeRequest[], count: number, limit: number, offset: number} | undefined, isError: boolean, isLoading: boolean}} */
    const {
        data: changeRequestsResponse,
        isLoading: loadingChangeRequests,
        isError: errorChangeRequests
    } = useGetChangeRequestsListQuery(
        { userId, limit: changeRequestPageSize, offset: 0 },
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

    // Fetch pending award approvals
    const {
        data: awardApprovals,
        isLoading: loadingAwardApprovals,
        isError: errorAwardApprovals
    } = useGetPendingAwardApprovalsQuery(undefined, { refetchOnMountOrArgChange: true });

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

    const taggedAwardApprovals = (awardApprovals ?? []).map(
        (/** @type {ProcurementTrackerPreAwardStep} */ step) => ({
            _type: "award",
            _sortDate: step.approval_requested_date ?? "",
            item: step
        })
    );
    const taggedBudgetRequisitions = (budgetRequisitions ?? []).map(
        (/** @type {ProcurementTrackerPreAwardStep} */ step) => ({
            _type: "budgetRequisition",
            _sortDate: step.approval_requested_date ?? "",
            item: step
        })
    );
    const taggedPreAwardApprovals = (preAwardApprovals ?? []).map(
        (/** @type {ProcurementTrackerPreAwardStep} */ step) => ({
            _type: "preAward",
            _sortDate: step.approval_requested_date ?? "",
            item: step
        })
    );
    // Expand each change request into one entry per card type so that allItems
    // has a 1:1 relationship with rendered cards, keeping pagination counts accurate.
    const taggedChangeRequests = changeRequests.flatMap((/** @type {ChangeRequest} */ cr) => {
        const cards = [];
        if (cr.has_proc_shop_change) cards.push({ _type: "crProcShop", _sortDate: cr.created_on ?? "", item: cr });
        if (cr.has_budget_change) cards.push({ _type: "crBudget", _sortDate: cr.created_on ?? "", item: cr });
        if (cr.has_status_change) cards.push({ _type: "crStatus", _sortDate: cr.created_on ?? "", item: cr });
        return cards;
    });

    const allItems = [...taggedBudgetRequisitions, ...taggedPreAwardApprovals, ...taggedAwardApprovals, ...taggedChangeRequests].sort((a, b) =>
        b._sortDate > a._sortDate
            ? 1
            : b._sortDate < a._sortDate
              ? -1
              : a._type < b._type
                ? -1
                : a._type > b._type
                  ? 1
                  : b.item.id - a.item.id
    );

    const totalPages = Math.ceil(allItems.length / PAGE_SIZE);
    const pageItems = allItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // Handle navigation to error page in useEffect to avoid setState during render
    React.useEffect(() => {
        if (errorChangeRequests || errorPreAwardApprovals || errorBudgetRequisitions || errorAwardApprovals) {
            navigate("/error");
        }
    }, [errorChangeRequests, errorPreAwardApprovals, errorBudgetRequisitions, errorAwardApprovals, navigate]);

    // Clamp currentPage when allItems shrinks (e.g. after approving an item reduces totalPages)
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    if (loadingChangeRequests || loadingPreAwardApprovals || loadingBudgetRequisitions || loadingAwardApprovals) {
        return <h1>Loading...</h1>;
    }
    if (errorChangeRequests || errorPreAwardApprovals || errorBudgetRequisitions || errorAwardApprovals) {
        return null;
    }

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
                            obligateByDate={
                                getObligateByDate(item.procurement_tracker?.agreement?.budget_line_items ?? []) ??
                                undefined
                            }
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
                            obligateByDate={
                                getObligateByDate(item.procurement_tracker?.agreement?.budget_line_items ?? []) ??
                                undefined
                            }
                            agreementTotal={item.procurement_tracker?.agreement?.agreement_total ?? 0}
                            requestorNotes={item.requestor_notes}
                        />
                    );
                }
                if (_type === "award") {
                    return (
                        <AwardReviewCard
                            key={`award-${item.id}`}
                            agreementId={item.procurement_tracker?.agreement?.id}
                            requestorId={item.approval_requested_by}
                            requestDate={item.approval_requested_date}
                            awardAmount={item.award_amount ?? undefined}
                            awardDate={item.award_date ?? undefined}
                        />
                    );
                }
                /** @type {ChangeRequest} */
                const cr = item;
                if (_type === "crProcShop") {
                    return (
                        <ProcurementShopReviewCard
                            key={`cr-proc-shop-${cr.id}`}
                            changeRequestId={cr.id}
                            agreementId={cr.agreement_id}
                            requesterName={cr.created_by_user?.display_name ?? cr.created_by_user?.full_name}
                            requestDate={cr.created_on}
                            handleReviewChangeRequest={handleReviewChangeRequest}
                            oldAwardingEntityId={cr?.requested_change_diff?.awarding_entity_id?.old ?? 0}
                            newAwardingEntityId={cr?.requested_change_diff?.awarding_entity_id?.new ?? 0}
                        />
                    );
                }
                if (_type === "crBudget") {
                    return (
                        <BudgetChangeReviewCard
                            key={`cr-budget-${cr.id}`}
                            changeRequestId={cr.id}
                            agreementId={cr.agreement_id}
                            requestDate={cr.created_on}
                            requesterName={cr.created_by_user?.display_name ?? cr.created_by_user?.full_name}
                            bliId={cr.budget_line_item_id ?? 0}
                            changeTo={cr.requested_change_diff}
                            handleReviewChangeRequest={handleReviewChangeRequest}
                        />
                    );
                }
                // crStatus
                return (
                    <StatusChangeReviewCard
                        key={`cr-status-${cr.id}`}
                        changeRequestId={cr.id}
                        agreementId={cr.agreement_id}
                        requestDate={cr.created_on}
                        requesterName={cr.created_by_user?.display_name ?? cr.created_by_user?.full_name}
                        bliId={cr.budget_line_item_id ?? 0}
                        changeTo={cr.requested_change_diff}
                        handleReviewChangeRequest={handleReviewChangeRequest}
                    />
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
