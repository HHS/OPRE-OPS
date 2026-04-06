import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    useUpdateProcurementTrackerStepMutation,
    useAddDocumentMutation,
    useUpdateDocumentStatusMutation,
    useGetProcurementTrackersByAgreementIdQuery
} from "../../../api/opsAPI";
import { getLocalISODate } from "../../../helpers/utils";
import {
    convertFileSizeToMB,
    isFileValid,
    processUploading,
    uploadDocumentToBlob,
    uploadDocumentToInMemory
} from "../../../components/Agreements/Documents/Document";
import {
    ProcurementTrackerStepStatus,
    ProcurementTrackerStatus
} from "../../../components/Agreements/ProcurementTracker/ProcurementTracker.constants";
import usePreAwardApprovalData from "./usePreAwardApprovalData";

/**
 * Custom hook for the Request Pre-Award Approval page
 * @param {number} agreementId - The agreement ID
 * @returns {Object} - Hook state and handlers
 */
export default function useRequestPreAwardApproval(agreementId) {
    const navigate = useNavigate();
    const [notes, setNotes] = useState("");
    const [selectedFile, setSelectedFile] = useState(/** @type {File | null} */ (null));
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [submitError, setSubmitError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [updateProcurementTrackerStep] = useUpdateProcurementTrackerStepMutation();
    const [addDocument] = useAddDocumentMutation();
    const [updateDocumentStatus] = useUpdateDocumentStatusMutation();

    // Use shared data fetching and processing hook
    const {
        agreement,
        isLoading,
        allBudgetLines,
        executingTotal,
        projectOfficerName,
        alternateProjectOfficerName,
        servicesComponents,
        groupedBudgetLinesByServicesComponent,
        preAwardMemoDocuments,
        step5
    } = usePreAwardApprovalData(agreementId);

    // Get Step 4 from procurement tracker (step5 comes from shared hook)
    const { data: procurementTrackersData } = useGetProcurementTrackersByAgreementIdQuery(agreementId, {
        skip: !agreementId
    });
    const trackers = procurementTrackersData?.data || [];
    const activeTracker = trackers.find(
        (/** @type {any} */ tracker) => tracker.status === ProcurementTrackerStatus.ACTIVE
    );
    const step4 = activeTracker?.steps?.find((/** @type {any} */ step) => step.step_number === 4);

    // Check if approval is pending (requested but not yet approved or declined)
    // This is used for both the banner and disabling buttons
    const isApprovalPending =
        step5?.approval_requested === true && (!step5?.approval_status || step5?.approval_status === "PENDING");

    // Check if approval has been approved (prevents re-requesting)
    const isApprovalApproved = step5?.approval_status === "APPROVED";

    // Check if approval was declined (allows re-requesting)
    const isApprovalDeclined = step5?.approval_status === "DECLINED";

    // Disable editing when pending OR approved, but allow re-request when declined
    const hasApprovalBeenRequested = (isApprovalPending || isApprovalApproved) && !isApprovalDeclined;

    // Check if any BLI is in review status
    const hasBLIInReview = agreement?.budget_line_items?.some((/** @type {any} */ bli) => bli.in_review) ?? false;

    // Check if Step 4 (Evaluation) is completed
    const isStep4Completed = step4?.status === ProcurementTrackerStepStatus.COMPLETED;

    const handleFileChange = (/** @type {any} */ e) => {
        const file = e.target.files[0];
        setUploadError("");

        if (file) {
            if (isFileValid(file)) {
                setSelectedFile(file);
            } else {
                setUploadError("Invalid file type. Please upload a PDF, Word, or Excel document.");
                setSelectedFile(null);
            }
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFile) {
            setUploadError("Please select a file to upload");
            return;
        }

        setIsUploading(true);
        setUploadError("");

        try {
            const documentData = {
                agreement_id: agreementId,
                document_type: "PRE_AWARD_CONSENSUS_MEMO",
                document_name: selectedFile.name,
                document_size: convertFileSizeToMB(selectedFile.size)
            };

            const response = await addDocument(documentData).unwrap();
            const { url, uuid } = response;

            await processUploading(
                url,
                uuid,
                selectedFile,
                agreementId,
                uploadDocumentToInMemory,
                uploadDocumentToBlob
            );

            await updateDocumentStatus({
                document_id: uuid,
                data: {
                    agreement_id: agreementId,
                    status: "uploaded"
                }
            }).unwrap();

            // Reset file selection
            setSelectedFile(null);
            setIsUploading(false);
        } catch (error) {
            console.error("Error uploading document:", error);
            setUploadError("Failed to upload document. Please try again.");
            setIsUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!step5?.id) {
            console.error("Step 5 not found");
            setSubmitError("Unable to submit approval request because required tracker information is missing.");
            return;
        }

        setIsSubmitting(true);
        setSubmitError("");

        try {
            await updateProcurementTrackerStep({
                stepId: step5.id,
                data: {
                    approval_requested: true,
                    approval_requested_date: getLocalISODate(),
                    requestor_notes: notes.trim() || null
                }
            }).unwrap();

            // Navigate back to procurement tracker with success message
            navigate(`/agreements/${agreementId}/procurement-tracker`, {
                state: { success: true }
            });
        } catch (error) {
            console.error("Failed to submit approval request:", error);
            setSubmitError("Failed to submit approval request. Please try again.");
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate(-1);
    };

    return {
        agreement,
        isLoading,
        allBudgetLines, // All budget lines for display (pre-award happens before IN_EXECUTION)
        executingTotal, // Total calculated from executing budget lines only
        notes,
        setNotes,
        handleSubmit,
        handleCancel,
        projectOfficerName,
        alternateProjectOfficerName,
        servicesComponents,
        groupedBudgetLinesByServicesComponent,
        selectedFile,
        handleFileChange,
        handleFileUpload,
        isUploading,
        uploadError,
        submitError,
        preAwardMemoDocuments,
        isSubmitting,
        isApprovalPending,
        hasApprovalBeenRequested,
        hasBLIInReview,
        isStep4Completed
    };
}
