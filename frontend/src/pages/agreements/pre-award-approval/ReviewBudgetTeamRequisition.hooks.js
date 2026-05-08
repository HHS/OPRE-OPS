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
    const approvalAlreadyProcessed = Boolean(
        step5?.requisition_approved_by !== null && step5?.requisition_approved_by !== undefined
    );

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
                        message: `Budget Team has approved the Pre-Award Requisition for Agreement ${agreement?.name}. The Final Consensus Memo can now be sent to the Procurement Shop.`,
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
        handleCancel,
        isFormValid,

        // Permissions
        hasPermission,
        approvalAlreadyProcessed
    };
}
