import { useMemo } from "react";
import {
    useGetAgreementByIdQuery,
    useGetServicesComponentsListQuery,
    useGetDocumentsByAgreementIdQuery,
    useGetProcurementTrackersByAgreementIdQuery
} from "../../../api/opsAPI";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import { groupByServicesComponent, budgetLinesTotal } from "../../../helpers/budgetLines.helpers";

/**
 * Shared hook for pre-award approval data fetching and processing.
 * Used by both RequestPreAwardApproval and ApprovePreAwardApproval pages.
 * @param {number} agreementId - The agreement ID
 * @returns {Object} - Shared data and computed values
 */
export default function usePreAwardApprovalData(agreementId) {
    // Fetch data
    const { data: agreement, isLoading } = useGetAgreementByIdQuery(agreementId);
    const { data: servicesComponents } = useGetServicesComponentsListQuery(agreementId, { skip: !agreementId });
    const { data: documentsData } = useGetDocumentsByAgreementIdQuery(agreementId, { skip: !agreementId });
    const { data: procurementTrackersData } = useGetProcurementTrackersByAgreementIdQuery(agreementId, {
        skip: !agreementId
    });

    // Get project officer names
    const projectOfficerName = useGetUserFullNameFromId(agreement?.project_officer_id);
    const alternateProjectOfficerName = useGetUserFullNameFromId(agreement?.alternate_project_officer_id);

    // Get all budget lines for display (pre-award happens before IN_EXECUTION status)
    const allBudgetLines = useMemo(() => agreement?.budget_line_items ?? [], [agreement?.budget_line_items]);

    // Get executing budget lines for total calculation
    const executingBudgetLines = useMemo(
        () =>
            agreement?.budget_line_items?.filter(/** @param {any} bli */ (bli) => bli.status === "IN_EXECUTION") ?? [],
        [agreement?.budget_line_items]
    );

    // Calculate total of executing budget lines only
    const executingTotal = useMemo(() => budgetLinesTotal(executingBudgetLines), [executingBudgetLines]);

    // Group all budget lines by services component for display
    const groupedBudgetLinesByServicesComponent = groupByServicesComponent(allBudgetLines, servicesComponents || []);

    // Get active tracker and steps from procurement tracker
    const trackers = procurementTrackersData?.data || [];
    const activeTracker = trackers.find(/** @param {any} tracker */ (tracker) => tracker.status === "ACTIVE");
    const step4 = activeTracker?.steps?.find(/** @param {any} step */ (step) => step.step_number === 4);
    const step5 = activeTracker?.steps?.find(/** @param {any} step */ (step) => step.step_number === 5);

    const preAwardRequestorName = useGetUserFullNameFromId(step5?.approval_requested_by);

    // Get existing Pre-Award Consensus Memo documents
    const preAwardMemoDocuments =
        documentsData?.documents?.filter(
            /** @param {any} doc */ (doc) => doc.document_type === "PRE_AWARD_CONSENSUS_MEMO"
        ) || [];

    return {
        agreement,
        isLoading,
        allBudgetLines,
        executingTotal,
        projectOfficerName,
        alternateProjectOfficerName,
        servicesComponents,
        groupedBudgetLinesByServicesComponent,
        preAwardMemoDocuments,
        activeTracker,
        step4,
        step5,
        preAwardRequestorName,
        preAwardApprovalRequestedDate: step5?.approval_requested_date
    };
}
