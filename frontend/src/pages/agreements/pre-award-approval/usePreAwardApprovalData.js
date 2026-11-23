import { useMemo } from "react";
import { getCurrentProcurementTracker, getTrackerBudgetLines } from "../../../helpers/procurementTracker.helpers";
import {
    useGetAgreementByIdQuery,
    useGetGrantNumbersListQuery,
    useGetServicesComponentsListQuery,
    useGetDocumentsByAgreementIdQuery,
    useGetProcurementTrackersByAgreementIdQuery
} from "../../../api/opsAPI";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import { AgreementType } from "../agreements.constants";
import { groupByGrantNumber, groupByServicesComponent, budgetLinesTotal } from "../../../helpers/budgetLines.helpers";

/**
 * Shared hook for pre-award approval data fetching and processing.
 * Used by both RequestPreAwardApproval and ApprovePreAwardApproval pages.
 * @param {number} agreementId - The agreement ID
 * @returns {Object} - Shared data and computed values
 */
export default function usePreAwardApprovalData(agreementId) {
    // Fetch data — refetchOnMountOrArgChange ensures fresh BLI state (e.g. in_review) is
    // loaded when the page is revisited after an edit, preventing stale tooltips/alerts.
    const {
        data: agreement,
        isLoading,
        isFetching
    } = useGetAgreementByIdQuery(agreementId, {
        refetchOnMountOrArgChange: true
    });
    const { data: servicesComponents } = useGetServicesComponentsListQuery(agreementId, { skip: !agreementId });
    const { data: grantNumbers } = useGetGrantNumbersListQuery(agreementId, { skip: !agreementId });
    const isGrant = agreement?.agreement_type === AgreementType.GRANT;
    // Documents feature is not yet live — skip until the backend storage integration is enabled.
    const { data: documentsData } = useGetDocumentsByAgreementIdQuery(agreementId, { skip: true });
    const { data: procurementTrackersData, isLoading: isLoadingTrackers } = useGetProcurementTrackersByAgreementIdQuery(
        agreementId,
        {
            skip: !agreementId
        }
    );

    // Get project officer names
    const projectOfficerName = useGetUserFullNameFromId(agreement?.project_officer_id);
    const alternateProjectOfficerName = useGetUserFullNameFromId(agreement?.alternate_project_officer_id);

    // Get all budget lines for display (pre-award happens before IN_EXECUTION status)
    const allBudgetLines = useMemo(() => agreement?.budget_line_items ?? [], [agreement?.budget_line_items]);

    // The tracker the Procurement Tracker tab shows: the latest contract mod's once there is one
    // (OPS-6513). Inactive trackers are ignored; COMPLETED ones are kept so award approval data
    // remains visible after step 6 is completed.
    const trackers = procurementTrackersData?.data || [];
    const activeTracker = getCurrentProcurementTracker(trackers);

    // Get executing budget lines for total calculation: a contract mod's requisition covers only
    // the lines that mod executed.
    const executingBudgetLines = useMemo(
        () =>
            getTrackerBudgetLines(activeTracker, agreement?.budget_line_items).filter(
                /** @param {any} bli */ (bli) => bli.status === "IN_EXECUTION"
            ),
        [activeTracker, agreement?.budget_line_items]
    );

    // Calculate total of executing budget lines only
    const executingTotal = useMemo(() => budgetLinesTotal(executingBudgetLines), [executingBudgetLines]);

    // Group all budget lines by services component (or grant number for grants) for display.
    // For grants, resolve the grant number number from grant_number_id so persisted grant BLIs group correctly.
    const decorateForGrant = (blis) =>
        blis.map((bli) => ({
            ...bli,
            grant_number_number: (grantNumbers ?? []).find((gn) => gn.id === bli.grant_number_id)?.number ?? 0
        }));

    const groupedBudgetLinesByServicesComponent = isGrant
        ? groupByGrantNumber(decorateForGrant(allBudgetLines), grantNumbers ?? [])
        : groupByServicesComponent(allBudgetLines, servicesComponents || []);

    // Group only executing budget lines by services component (used by the Budget Team
    // Requisition Review page, which shows only the BLs included in the requisition)
    const groupedExecutingBudgetLinesByServicesComponent = isGrant
        ? groupByGrantNumber(decorateForGrant(executingBudgetLines), grantNumbers ?? [])
        : groupByServicesComponent(executingBudgetLines, servicesComponents || []);

    const step4 = activeTracker?.steps?.find(/** @param {any} step */ (step) => step.step_number === 4);
    const step5 = activeTracker?.steps?.find(/** @param {any} step */ (step) => step.step_number === 5);
    const step6 = activeTracker?.steps?.find(/** @param {any} step */ (step) => step.step_number === 6);

    const preAwardRequestorName = useGetUserFullNameFromId(step5?.approval_requested_by);
    const awardRequestorName = useGetUserFullNameFromId(step6?.approval_requested_by);

    // Get existing Pre-Award Consensus Memo documents
    const preAwardMemoDocuments =
        documentsData?.documents?.filter(
            /** @param {any} doc */ (doc) => doc.document_type === "PRE_AWARD_CONSENSUS_MEMO"
        ) || [];

    return {
        agreement,
        isLoading,
        isFetching,
        isLoadingTrackers,
        allBudgetLines,
        executingBudgetLines,
        executingTotal,
        projectOfficerName,
        alternateProjectOfficerName,
        servicesComponents,
        grantNumbers,
        groupedBudgetLinesByServicesComponent,
        groupedExecutingBudgetLinesByServicesComponent,
        preAwardMemoDocuments,
        activeTracker,
        step4,
        step5,
        preAwardRequestorName,
        preAwardApprovalRequestedDate: step5?.approval_requested_date,
        step6,
        requestorName: awardRequestorName,
        requestorDate: step6?.approval_requested_date
    };
}
