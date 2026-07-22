import { useState, useMemo, useEffect } from "react";
import { flushSync } from "react-dom";
import { useNavigate, useBlocker } from "react-router-dom";
import {
    useUpdateProcurementTrackerStepMutation,
    useAddDocumentMutation,
    useUpdateDocumentStatusMutation
} from "../../../api/opsAPI";
import { getLocalISODate } from "../../../helpers/utils";
import {
    convertFileSizeToMB,
    isFileValid,
    processUploading,
    uploadDocumentToBlob,
    uploadDocumentToInMemory
} from "../../../components/Agreements/Documents/Document";
import { PROCUREMENT_STEP_STATUS } from "../../../components/Agreements/ProcurementTracker/ProcurementTracker.constants";
import usePreAwardApprovalData from "./usePreAwardApprovalData";
import agreementSuite, { validateBudgetLineItems } from "./suite";
import { VALIDATABLE_BLI_STATUSES } from "./constants";

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

    // Modal state for cancel confirmation and navigation blocking
    const [showModal, setShowModal] = useState(false);
    const [modalProps, setModalProps] = useState({});
    const [isNavigating, setIsNavigating] = useState(false);

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
        step4,
        step5
    } = usePreAwardApprovalData(agreementId);

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

    // True when ANY BLI has a pending change request — blocks submission and shows the alert.
    const hasBLIInReview = agreement?.budget_line_items?.some((/** @type {any} */ bli) => bli.in_review) ?? false;

    // Check if Step 4 (Evaluation) is completed
    const isStep4Completed = step4?.status === PROCUREMENT_STEP_STATUS.COMPLETED;

    // Only PLANNED and IN_EXECUTION budget lines require pre-award validation.
    // DRAFT lines aren't yet committed for approval; OBLIGATED lines have already
    // completed the full award cycle and don't need pre-award checks.
    // PLANNED_MOD lines are excluded because modifications follow a separate approval path.
    const validatableBudgetLines = useMemo(
        () => allBudgetLines.filter(/** @param {any} bli */ (bli) => VALIDATABLE_BLI_STATUSES.includes(bli.status)),
        [allBudgetLines]
    );

    const [agreementValidationResults, setAgreementValidationResults] = useState(null);
    const [pageErrors, setPageErrors] = useState({});
    const [isAlertActive, setIsAlertActive] = useState(false);

    const bliValidationResults = useMemo(() => {
        if (validatableBudgetLines.length === 0) return [];
        return validateBudgetLineItems(validatableBudgetLines);
    }, [validatableBudgetLines]);

    const hasBLIError = useMemo(() => bliValidationResults.some(({ isValid }) => !isValid), [bliValidationResults]);

    // Run agreement validation and aggregate page errors in a single effect.
    // Aggregating from the local `result` (rather than the agreementValidationResults
    // state) avoids a stale-read window where errors would be derived from the
    // previous agreement's validation on the first commit after `agreement` changes.
    useEffect(() => {
        if (!agreement) {
            setAgreementValidationResults(null);
            setPageErrors({});
            setIsAlertActive(false);
            return undefined;
        }

        const result = agreementSuite.run({ ...agreement });
        setAgreementValidationResults(result);

        const aggregated = {};

        if (result && !result.isValid()) {
            const errors = { ...result.getErrors() };
            // Match ReviewAgreement behavior: for CONTRACT/IAA the project officer
            // field is labelled "COR" in the UI, so rekey the error accordingly.
            if (
                (agreement.agreement_type === "CONTRACT" || agreement.agreement_type === "IAA") &&
                Object.prototype.hasOwnProperty.call(errors, "project-officer")
            ) {
                errors.cor = errors["project-officer"];
                delete errors["project-officer"];
            }
            Object.assign(aggregated, errors);
        }

        if (hasBLIError) {
            const seen = new Set();
            bliValidationResults.forEach(({ isValid, errors }) => {
                if (isValid) return;
                Object.entries(errors).forEach(([fieldName, messages]) => {
                    if (seen.has(fieldName)) return;
                    seen.add(fieldName);
                    aggregated[fieldName] = messages;
                });
            });
        }

        if (Object.keys(aggregated).length > 0) {
            setPageErrors(aggregated);
            setIsAlertActive(true);
        } else {
            setPageErrors({});
            setIsAlertActive(false);
        }

        return () => {
            agreementSuite.reset();
        };
    }, [agreement, hasBLIError, bliValidationResults]);

    /**
     * Track if any changes have been made to the form
     */
    const hasChanged = useMemo(() => {
        return notes.trim() !== "" || selectedFile !== null;
    }, [notes, selectedFile]);

    /**
     * Navigation blocker - prevents accidental navigation when there are unsaved changes
     */
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            !isNavigating && hasChanged && currentLocation.pathname !== nextLocation.pathname
    );

    // Handle blocker state changes
    useEffect(() => {
        if (blocker.state === "blocked") {
            setShowModal(true);
            setModalProps({
                heading: "Are you sure you want to cancel? Your changes will not be saved.",
                actionButtonText: "Yes, Cancel",
                secondaryButtonText: "Continue Editing",
                handleConfirm: () => {
                    setShowModal(false);
                    flushSync(() => {
                        setIsNavigating(true);
                    });
                    blocker.proceed?.();
                },
                closeModal: () => {
                    setShowModal(false);
                    blocker.reset?.();
                }
            });
        }
    }, [blocker.state, blocker]);

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
        } catch {
            setUploadError("Failed to upload document. Please try again.");
            setIsUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!step5?.id) {
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

            // Allow navigation after successful submission
            // Use flushSync to ensure state update completes before navigation
            flushSync(() => {
                setIsNavigating(true);
            });
            navigate(`/agreements/${agreementId}/procurement-tracker`, {
                state: { success: true }
            });
        } catch {
            setSubmitError("Failed to submit approval request. Please try again.");
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setShowModal(true);
        setModalProps({
            heading: "Are you sure you want to cancel? Your changes will not be saved.",
            actionButtonText: "Yes, Cancel",
            secondaryButtonText: "Continue Editing",
            handleConfirm: () => {
                setShowModal(false);
                setIsNavigating(true);
                navigate(-1);
            },
            closeModal: () => {
                setShowModal(false);
            }
        });
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
        isStep4Completed,
        showModal,
        setShowModal,
        modalProps,
        validatableBudgetLines,
        agreementValidationResults,
        hasBLIError,
        pageErrors,
        isAlertActive,
        setIsAlertActive
    };
}
