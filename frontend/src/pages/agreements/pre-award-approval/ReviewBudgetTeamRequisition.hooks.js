import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, shallowEqual } from "react-redux";
import { useUpdateProcurementTrackerStepMutation } from "../../../api/opsAPI";
import useAlert from "../../../hooks/use-alert.hooks";
import usePreAwardApprovalData from "./usePreAwardApprovalData";

/**
 * Custom hook for the ReviewBudgetTeamRequisition page.
 * @param {number} agreementId - The agreement ID.
 * @returns {{
 *   agreement: any,
 *   isLoading: boolean,
 *   allBudgetLines: any[],
 *   executingTotal: number,
 *   projectOfficerName: string,
 *   alternateProjectOfficerName: string,
 *   servicesComponents: any[],
 *   groupedBudgetLinesByServicesComponent: any[],
 *   preAwardMemoDocuments: any[],
 *   requestorNotes: string,
 *   reviewerNotes: string,
 *   preAwardRequestorName: string,
 *   preAwardApprovalRequestedDate: string,
 *   requisitionNumber: string,
 *   setRequisitionNumber: (value: string) => void,
 *   requisitionDate: string,
 *   setRequisitionDate: (value: string) => void,
 *   attestationChecked: boolean,
 *   setAttestationChecked: (value: boolean) => void,
 *   showModal: boolean,
 *   setShowModal: (value: boolean) => void,
 *   modalProps: any,
 *   isSubmitting: boolean,
 *   submitError: string,
 *   handleApprove: () => void,
 *   handleCancel: () => void,
 *   isFormValid: () => boolean,
 *   hasPermission: boolean,
 *   approvalAlreadyProcessed: boolean
 * }} Hook state and functions.
 */
export default function useReviewBudgetTeamRequisition(agreementId) {
    const navigate = useNavigate();
    const { setAlert } = useAlert();

    // Form state
    const [requisitionNumber, setRequisitionNumber] = useState("");
    const [requisitionDate, setRequisitionDate] = useState("");
    const [attestationChecked, setAttestationChecked] = useState(false);

    // UI state
    const [showModal, setShowModal] = useState(false);
    const [modalProps, setModalProps] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    // Auth - use separate selectors with shallowEqual to prevent infinite loops
    // @ts-expect-error - Redux state typing in JS files
    const userRoles = useSelector((state) => state.auth?.activeUser?.roles ?? [], shallowEqual);

    const [updateProcurementTrackerStep] = useUpdateProcurementTrackerStepMutation();

    // Fetch data using shared hook
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
        step5,
        preAwardRequestorName,
        preAwardApprovalRequestedDate
    } = usePreAwardApprovalData(agreementId);

    const requestorNotes = step5?.requestor_notes || "";
    const reviewerNotes = step5?.reviewer_notes || "";

    // Check if already processed
    const approvalAlreadyProcessed = step5?.requisition_approved_by != null;

    // Permission check: BUDGET_TEAM or SYSTEM_OWNER
    const hasPermission = useMemo(() => {
        const userRoleNames = userRoles.map(/** @param {any} role */ (role) => role?.name);
        return userRoleNames.includes("BUDGET_TEAM") || userRoleNames.includes("SYSTEM_OWNER");
    }, [userRoles]);

    // Form validation
    const isFormValid = () => {
        return requisitionNumber.trim() !== "" && requisitionDate !== "" && attestationChecked;
    };

    // Approve handler
    const handleApprove = async () => {
        if (!step5?.id) {
            setSubmitError("Unable to submit: procurement tracker step not found");
            return;
        }

        if (!isFormValid()) {
            setSubmitError("Please fill in all required fields and check the attestation.");
            return;
        }

        setShowModal(true);
        setModalProps({
            heading:
                "Are you sure you want to approve this Pre-Award Requisition? The COR will send the Final Consensus Memo to the Procurement Shop and the agreement will be locked from editing until after it's awarded.",
            actionButtonText: "Approve",
            secondaryButtonText: "Cancel",
            handleConfirm: async () => {
                setShowModal(false);
                setIsSubmitting(true);
                setSubmitError("");

                try {
                    await updateProcurementTrackerStep({
                        stepId: step5.id,
                        data: {
                            requisition_number: requisitionNumber,
                            requisition_date: requisitionDate
                            // requisition_approved_by is server-controlled and set automatically
                        }
                    }).unwrap();

                    setAlert({
                        type: "success",
                        heading: "Pre-Award Requisition approved",
                        message: `"${agreement?.name}" agreement has been successfully approved for Pre-Award Requisition. The COR will be notified to upload the Final Consensus Memo to the HHS Consolidated Acquisition Solution (HCAS). The agreement will be locked from editing until after it's awarded.`,
                        redirectUrl: "/agreements?filter=change-requests"
                    });
                } catch (error) {
                    setSubmitError(
                        /** @type {any} */ (error)?.data?.error || "Failed to approve pre-award requisition"
                    );
                    setIsSubmitting(false);
                }
            }
        });
    };

    // Save Draft handler (partial save without approval)
    const handleSaveDraft = async () => {
        // Validate at least one field is filled
        if (!requisitionNumber.trim() && !requisitionDate) {
            setSubmitError("Please enter at least a Requisition # or Requisition Date to save.");
            return;
        }

        if (!step5?.id) {
            setSubmitError("Unable to save: procurement tracker step not found");
            return;
        }

        setIsSubmitting(true);
        setSubmitError("");

        try {
            // Build request data - only include fields with values
            /** @type {Record<string, any>} */
            const data = {
                is_draft: true // CRITICAL: Prevents approval trigger
            };

            // Only send requisition_number if it has a value
            if (requisitionNumber.trim()) {
                data.requisition_number = requisitionNumber;
            }

            // Only send requisition_date if it has a value
            if (requisitionDate) {
                data.requisition_date = requisitionDate;
            }

            // Call same mutation as approve, but with is_draft flag
            // Server knows this is a draft save and will NOT trigger approval
            await updateProcurementTrackerStep({
                stepId: step5.id,
                data
            }).unwrap();

            // Success: Show success message and redirect
            setAlert({
                type: "success",
                heading: "Draft saved",
                message: "Requisition information has been saved. You can return later to complete the approval.",
                redirectUrl: "/agreements?filter=change-requests"
            });

            setIsSubmitting(false);
        } catch (error) {
            setSubmitError(/** @type {any} */ (error)?.data?.error || "Failed to save draft");
            setIsSubmitting(false);
        }
    };

    // Cancel handler
    const handleCancel = () => {
        setShowModal(true);
        setModalProps({
            heading: "Are you sure you want to cancel?",
            description: "Any information you have entered will be discarded.",
            actionButtonText: "Continue Editing",
            secondaryButtonText: "Discard Changes",
            handleConfirm: () => {
                setShowModal(false);
            },
            handleSecondary: () => {
                navigate("/agreements?filter=change-requests");
            }
        });
    };

    return {
        // Data
        agreement,
        isLoading,
        allBudgetLines,
        executingTotal,
        projectOfficerName,
        alternateProjectOfficerName,
        servicesComponents,
        groupedBudgetLinesByServicesComponent,
        preAwardMemoDocuments,
        requestorNotes,
        reviewerNotes,
        preAwardRequestorName,
        preAwardApprovalRequestedDate,

        // Form state
        requisitionNumber,
        setRequisitionNumber,
        requisitionDate,
        setRequisitionDate,
        attestationChecked,
        setAttestationChecked,

        // UI state
        showModal,
        setShowModal,
        modalProps,
        isSubmitting,
        submitError,

        // Handlers
        handleApprove,
        handleSaveDraft,
        handleCancel,
        isFormValid,

        // Permissions
        hasPermission,
        approvalAlreadyProcessed
    };
}
