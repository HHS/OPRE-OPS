import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetAgreementByIdQuery, useUpdateProcurementTrackerStepMutation } from "../../../api/opsAPI";
import { getLocalISODate } from "../../../helpers/utils";

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

    // Fetch agreement data with procurement tracker
    const { data: agreement, isLoading } = useGetAgreementByIdQuery(agreementId, {
        refetchOnMountOrArgChange: true
    });

    // Get Step 6 from procurement tracker
    const procurementTracker = agreement?.procurement_tracker;
    const step6 = procurementTracker?.steps?.find((/** @type {any} */ step) => step.step_number === 6);

    // Check if approval has been requested
    const hasApprovalBeenRequested = step6?.approval_requested === true;

    // Check if any BLI is in review status
    const hasBLIInReview = agreement?.budget_line_items?.some((/** @type {any} */ bli) => bli.in_review) ?? false;

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

            // Navigate back to procurement tracker
            navigate(`/agreements/${agreementId}/procurement-tracker`);
        } catch (error) {
            console.error("Failed to request award approval:", error);
            setSubmitError(
                error?.data?.message || "Failed to request award approval. Please try again."
            );
            setIsSubmitting(false);
        }
    };

    /**
     * Handle cancel - navigate back to procurement tracker
     */
    const handleCancel = () => {
        navigate(`/agreements/${agreementId}/procurement-tracker`);
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
        hasBLIInReview
    };
}
