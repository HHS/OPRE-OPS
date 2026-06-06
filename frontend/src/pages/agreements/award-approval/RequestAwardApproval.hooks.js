import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    useGetAgreementByIdQuery,
    useGetProcurementTrackersByAgreementIdQuery,
    useUpdateProcurementTrackerStepMutation,
    useGetServicesComponentsListQuery
} from "../../../api/opsAPI";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import { getLocalISODate } from "../../../helpers/utils";
import { groupByServicesComponent } from "../../../helpers/budgetLines.helpers";
import { PROCUREMENT_STEP_STATUS } from "../../../components/Agreements/ProcurementTracker/ProcurementTracker.constants";

/**
 * Custom hook for the Request Award Approval page
 * @param {number} agreementId - The agreement ID
 * @returns {Object} - Hook state and handlers
 */
export default function useRequestAwardApproval(agreementId) {
    const navigate = useNavigate();
    const [notes, setNotes] = useState("");
    const [submitError, setSubmitError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [updateProcurementTrackerStep] = useUpdateProcurementTrackerStepMutation();

    // Fetch agreement data
    const { data: agreement, isLoading: isLoadingAgreement } = useGetAgreementByIdQuery(agreementId, {
        refetchOnMountOrArgChange: true
    });

    // Fetch procurement tracker data
    const { data: trackersData, isLoading: isLoadingTrackers } = useGetProcurementTrackersByAgreementIdQuery(
        agreementId,
        {
            skip: !agreementId,
            refetchOnMountOrArgChange: true
        }
    );

    // Fetch services components
    const { data: servicesComponents } = useGetServicesComponentsListQuery(agreementId, { skip: !agreementId });

    // Get active tracker and steps
    const trackers = trackersData?.data || [];
    const activeTracker = trackers.find((tracker) => tracker.status === "ACTIVE");
    const step5 = activeTracker?.steps?.find((/** @type {any} */ step) => step.step_number === 5);
    const step6 = activeTracker?.steps?.find((/** @type {any} */ step) => step.step_number === 6);

    // Get project officer names
    const projectOfficerName = useGetUserFullNameFromId(agreement?.project_officer_id);
    const alternateProjectOfficerName = useGetUserFullNameFromId(agreement?.alternate_project_officer_id);

    // Get all budget lines for display
    const allBudgetLines = agreement?.budget_line_items ?? [];

    // Group all budget lines by services component for display
    const groupedBudgetLinesByServicesComponent = groupByServicesComponent(allBudgetLines, servicesComponents || []);

    // Check if Step 5 is completed (prerequisite)
    const isStep5Completed = step5?.status === PROCUREMENT_STEP_STATUS.COMPLETED;

    // Check if approval has been requested
    const hasApprovalBeenRequested = step6?.approval_requested === true;

    // Check if any BLI is in review status
    const hasBLIInReview = agreement?.budget_line_items?.some((/** @type {any} */ bli) => bli.in_review) ?? false;

    const isLoading = isLoadingAgreement || isLoadingTrackers;

    /**
     * Handle form submission - request award approval
     */
    const handleSubmit = async () => {
        if (!step6?.id) {
            setSubmitError("Step 6 not found for this agreement.");
            return;
        }

        setIsSubmitting(true);
        setSubmitError("");

        try {
            await updateProcurementTrackerStep({
                stepId: step6.id,
                data: {
                    approval_requested: true,
                    approval_requested_date: getLocalISODate(),
                    requestor_notes: notes.trim() || null
                }
            }).unwrap();

            // Navigate back to procurement tracker with success state
            navigate(`/agreements/${agreementId}/procurement-tracker`, { state: { success: true } });
        } catch (error) {
            console.error("Failed to request award approval:", error);
            setSubmitError(error?.data?.message || "Failed to request award approval. Please try again.");
            setIsSubmitting(false);
        }
    };

    /**
     * Handle cancel - navigate back to previous page
     */
    const handleCancel = () => {
        navigate(-1);
    };

    return {
        agreement,
        isLoading,
        notes,
        setNotes,
        handleSubmit,
        handleCancel,
        submitError,
        isSubmitting,
        hasApprovalBeenRequested,
        hasBLIInReview,
        isStep5Completed,
        projectOfficerName,
        alternateProjectOfficerName,
        allBudgetLines,
        servicesComponents,
        groupedBudgetLinesByServicesComponent
    };
}
