import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    useGetAgreementByIdQuery,
    useGetServicesComponentsListQuery,
    useUpdateProcurementTrackerStepMutation,
    useAddDocumentMutation,
    useUpdateDocumentStatusMutation,
    useGetDocumentsByAgreementIdQuery,
    useGetProcurementTrackersByAgreementIdQuery
} from "../../../api/opsAPI";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import { getLocalISODate } from "../../../helpers/utils";
import { groupByServicesComponent } from "../../../helpers/budgetLines.helpers";
import {
    convertFileSizeToMB,
    isFileValid,
    processUploading,
    uploadDocumentToBlob,
    uploadDocumentToInMemory
} from "../../../components/Agreements/Documents/Document";
import {
    PROCUREMENT_STEP_STATUS,
    PROCUREMENT_TRACKER_STATUS
} from "../../../components/Agreements/ProcurementTracker/ProcurementTracker.constants";

/**
 * Custom hook for the Request Pre-Award Approval page
 * @param {number} agreementId - The agreement ID
 * @returns {Object} - Hook state and handlers
 */
export default function useRequestPreAwardApproval(agreementId) {
    const navigate = useNavigate();
    const [notes, setNotes] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [submitError, setSubmitError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: agreement, isLoading } = useGetAgreementByIdQuery(agreementId);
    const [updateProcurementTrackerStep] = useUpdateProcurementTrackerStepMutation();
    const { data: servicesComponents } = useGetServicesComponentsListQuery(agreementId, { skip: !agreementId });
    const [addDocument] = useAddDocumentMutation();
    const [updateDocumentStatus] = useUpdateDocumentStatusMutation();
    const { data: documentsData } = useGetDocumentsByAgreementIdQuery(agreementId, { skip: !agreementId });
    const { data: procurementTrackersData } = useGetProcurementTrackersByAgreementIdQuery(agreementId, {
        skip: !agreementId
    });

    const projectOfficerName = useGetUserFullNameFromId(agreement?.project_officer_id);
    const alternateProjectOfficerName = useGetUserFullNameFromId(agreement?.alternate_project_officer_id);

    // Get executing budget lines
    const executingBudgetLines = agreement?.budget_line_items?.filter((bli) => bli.status === "IN_EXECUTION") || [];

    // Group budget lines by services component
    const groupedBudgetLinesByServicesComponent = groupByServicesComponent(
        executingBudgetLines,
        servicesComponents || []
    );

    // Get Step 4 and Step 5 from procurement tracker
    const trackers = procurementTrackersData?.data || [];
    const activeTracker = trackers.find((tracker) => tracker.status === PROCUREMENT_TRACKER_STATUS.ACTIVE);
    const step4 = activeTracker?.steps?.find((step) => step.step_number === 4);
    const step5 = activeTracker?.steps?.find((step) => step.step_number === 5);

    // Get existing Pre-Award Consensus Memo documents
    const preAwardMemoDocuments =
        documentsData?.documents?.filter((doc) => doc.document_type === "PRE_AWARD_CONSENSUS_MEMO") || [];

    // Check if approval is pending (requested but not yet approved or declined)
    // This is used for both the banner and disabling buttons
    const isApprovalPending =
        step5?.approval_requested === true &&
        (!step5?.approval_status || step5?.approval_status === "PENDING");

    // Check if approval has been approved (prevents re-requesting)
    const isApprovalApproved = step5?.approval_status === "APPROVED";

    // Disable editing when pending OR approved (but allow re-request when declined)
    const hasApprovalBeenRequested = isApprovalPending || isApprovalApproved;

    // Check if any BLI is in review status
    const hasBLIInReview = agreement?.budget_line_items?.some((bli) => bli.in_review) ?? false;

    // Check if Step 4 (Evaluation) is completed
    const isStep4Completed = step4?.status === PROCUREMENT_STEP_STATUS.COMPLETED;

    const handleFileChange = (e) => {
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
        executingBudgetLines,
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
