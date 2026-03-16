import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetAgreementByIdQuery, useUpdateProcurementTrackerStepMutation } from "../../../api/opsAPI";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import { formatDateForApi } from "../../../helpers/utils";

/**
 * Custom hook for the Request Pre-Award Approval page
 * @param {number} agreementId - The agreement ID
 * @returns {Object} - Hook state and handlers
 */
export default function useRequestPreAwardApproval(agreementId) {
    const navigate = useNavigate();
    const [notes, setNotes] = useState("");

    const { data: agreement, isLoading } = useGetAgreementByIdQuery(agreementId);
    const [updateProcurementTrackerStep] = useUpdateProcurementTrackerStepMutation();

    const projectOfficerName = useGetUserFullNameFromId(agreement?.project_officer_id);
    const alternateProjectOfficerName = useGetUserFullNameFromId(agreement?.alternate_project_officer_id);

    // Get executing budget lines
    const executingBudgetLines = agreement?.budget_line_items?.filter((bli) => bli.status === "EXECUTING") || [];

    // Get Step 5 (Pre-Award) from procurement tracker
    const procurementTracker = agreement?.procurement_tracker;
    const step5 = procurementTracker?.steps?.find((step) => step.step_number === 5);

    const handleSubmit = async () => {
        if (!step5?.id) {
            console.error("Step 5 not found");
            return;
        }

        try {
            await updateProcurementTrackerStep({
                id: step5.id,
                pre_award_approval_requested: true,
                pre_award_approval_requested_date: formatDateForApi(new Date()),
                pre_award_requestor_notes: notes.trim() || null
            }).unwrap();

            // Navigate back to agreement detail / procurement tracker
            navigate(`/agreements/${agreementId}?tab=procurement-tracker`, {
                state: { success: "Pre-Award approval request submitted successfully" }
            });
        } catch (error) {
            console.error("Failed to submit approval request:", error);
        }
    };

    const handleCancel = () => {
        navigate(`/agreements/${agreementId}?tab=procurement-tracker`);
    };

    return {
        agreement,
        isLoading,
        executingBudgetLines,
        notes,
        setNotes,
        handleSubmit,
        handleCancel,
        projectOfficerName,
        alternateProjectOfficerName
    };
}
