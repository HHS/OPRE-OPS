import { useMemo } from "react";
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
    // Fetch data
    const { data: agreement, isLoading } = useGetAgreementByIdQuery(agreementId);
    const { data: servicesComponents } = useGetServicesComponentsListQuery(agreementId, { skip: !agreementId });
    const { data: grantNumbers } = useGetGrantNumbersListQuery(agreementId, { skip: !agreementId });
    const isGrant = agreement?.agreement_type === AgreementType.GRANT;
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
        executingBudgetLines,
        executingTotal,
        projectOfficerName,
        alternateProjectOfficerName,
        servicesComponents,
        groupedBudgetLinesByServicesComponent,
        groupedExecutingBudgetLinesByServicesComponent,
        preAwardMemoDocuments,
        activeTracker,
        step4,
        step5,
        preAwardRequestorName,
        preAwardApprovalRequestedDate: step5?.approval_requested_date
    };
}
