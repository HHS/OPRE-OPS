import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    useGetAgreementByIdQuery,
    useGetServicesComponentsListQuery,
    useUpdateProcurementTrackerStepMutation,
    useAddDocumentMutation,
    useUpdateDocumentStatusMutation,
    useGetDocumentsByAgreementIdQuery
} from "../../../api/opsAPI";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import { formatDateForApi } from "../../../helpers/utils";
import { groupByServicesComponent } from "../../../helpers/budgetLines.helpers";
import {
    convertFileSizeToMB,
    isFileValid,
    processUploading,
    uploadDocumentToBlob,
    uploadDocumentToInMemory
} from "../../../components/Agreements/Documents/Document";

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

    const { data: agreement, isLoading } = useGetAgreementByIdQuery(agreementId);
    const [updateProcurementTrackerStep] = useUpdateProcurementTrackerStepMutation();
    const { data: servicesComponents } = useGetServicesComponentsListQuery(agreementId, { skip: !agreementId });
    const [addDocument] = useAddDocumentMutation();
    const [updateDocumentStatus] = useUpdateDocumentStatusMutation();
    const { data: documentsData } = useGetDocumentsByAgreementIdQuery(agreementId, { skip: !agreementId });

    const projectOfficerName = useGetUserFullNameFromId(agreement?.project_officer_id);
    const alternateProjectOfficerName = useGetUserFullNameFromId(agreement?.alternate_project_officer_id);

    // Get executing budget lines
    const executingBudgetLines = agreement?.budget_line_items?.filter((bli) => bli.status === "EXECUTING") || [];

    // Group budget lines by services component
    const groupedBudgetLinesByServicesComponent = groupByServicesComponent(
        executingBudgetLines,
        servicesComponents || []
    );

    // Get Step 5 (Pre-Award) from procurement tracker
    const procurementTracker = agreement?.procurement_tracker;
    const step5 = procurementTracker?.steps?.find((step) => step.step_number === 5);

    // Get existing Pre-Award Consensus Memo documents
    const preAwardMemoDocuments =
        documentsData?.documents?.filter((doc) => doc.document_type === "PRE_AWARD_CONSENSUS_MEMO") || [];

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
            return;
        }

        try {
            await updateProcurementTrackerStep({
                stepId: step5.id,
                data: {
                    approval_requested: true,
                    approval_requested_date: formatDateForApi(new Date()),
                    requestor_notes: notes.trim() || null
                }
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
        alternateProjectOfficerName,
        servicesComponents,
        groupedBudgetLinesByServicesComponent,
        selectedFile,
        handleFileChange,
        handleFileUpload,
        isUploading,
        uploadError,
        preAwardMemoDocuments
    };
}
