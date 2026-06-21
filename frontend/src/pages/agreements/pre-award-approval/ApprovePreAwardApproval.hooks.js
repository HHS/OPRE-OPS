import { useState, useMemo, useEffect } from "react";
import { flushSync } from "react-dom";
import { useNavigate, useBlocker } from "react-router-dom";
import { useSelector, shallowEqual } from "react-redux";
import { useUpdateProcurementTrackerStepMutation } from "../../../api/opsAPI";
import useAlert from "../../../hooks/use-alert.hooks";
import usePreAwardApprovalData from "./usePreAwardApprovalData";

/**
 * Custom hook for the ApprovePreAwardApproval page.
 * @param {number} agreementId - The agreement ID.
 * @returns {{
 *   agreement: any,
 *   isLoading: boolean,
 *   executingBudgetLines: any[],
 *   executingTotal: number,
 *   reviewerNotes: string,
 *   setReviewerNotes: (value: string) => void,
 *   requestorNotes: string,
 *   handleApprove: () => void,
 *   handleDecline: () => void,
 *   handleCancel: () => void,
 *   projectOfficerName: string,
 *   alternateProjectOfficerName: string,
 *   servicesComponents: any[],
 *   groupedBudgetLinesByServicesComponent: any[],
 *   preAwardMemoDocuments: any[],
 *   showModal: boolean,
 *   setShowModal: (value: boolean) => void,
 *   modalProps: any,
 *   isSubmitting: boolean,
 *   submitError: string,
 *   hasPermission: boolean,
 *   approvalAlreadyProcessed: boolean,
 *   preAwardRequestorName: string,
 *   preAwardApprovalRequestedDate: string
 * }} Hook state and functions.
 */
export default function useApprovePreAwardApproval(agreementId) {
    const navigate = useNavigate();
    const { setAlert } = useAlert();
    const [reviewerNotes, setReviewerNotes] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalProps, setModalProps] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [isNavigating, setIsNavigating] = useState(false);

    // Use separate selectors with shallowEqual to prevent infinite loops
    // @ts-expect-error - Redux state typing in JS files
    const userId = useSelector((state) => state.auth?.activeUser?.id) ?? null;
    // @ts-expect-error - Redux state typing in JS files
    const userRoles = useSelector((state) => state.auth?.activeUser?.roles ?? [], shallowEqual);

    const [updateProcurementTrackerStep] = useUpdateProcurementTrackerStepMutation();

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
        step5,
        preAwardRequestorName,
        preAwardApprovalRequestedDate
    } = usePreAwardApprovalData(agreementId);

    // Get submitter's notes
    const requestorNotes = step5?.requestor_notes || "";

    // Check if approval already processed (returns boolean, not null)
    const approvalAlreadyProcessed = Boolean(step5?.approval_status && step5.approval_status !== "PENDING");

    // Permission check: user is Division Director, Deputy Director, or System Owner
    // NOTE: BUDGET_TEAM is NOT authorized for DD pre-award approval, only for requisition approval
    const hasPermission = useMemo(() => {
        const userRoleNames = userRoles.map(/** @param {any} role */ (role) => role?.name);

        // SYSTEM_OWNER has permission regardless of division
        if (userRoleNames.includes("SYSTEM_OWNER")) {
            return true;
        }

        // For all other users (including REVIEWER_APPROVER or no specific role),
        // check if user is division director/deputy for any CAN in the budget lines.
        // This aligns with backend authorization and notification recipient logic.
        return allBudgetLines.some(
            /** @param {any} bli */ (bli) =>
                bli.can?.portfolio?.division?.division_director_id === userId ||
                bli.can?.portfolio?.division?.deputy_division_director_id === userId
        );
    }, [userRoles, userId, allBudgetLines]);

    /**
     * Track if any changes have been made to the form
     */
    const hasChanged = useMemo(() => {
        return reviewerNotes.trim() !== "";
    }, [reviewerNotes]);

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
                heading:
                    "Are you sure you want to cancel? This will exit the review process and you can come back to it later.",
                actionButtonText: "Cancel",
                secondaryButtonText: "Continue Reviewing",
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

    /**
     * @param {"APPROVED" | "DECLINED"} action
     */
    const handleAction = async (action) => {
        if (!step5?.id) {
            setSubmitError("Step 5 not found. Cannot process approval request.");
            return;
        }

        const actionText = action === "APPROVED" ? "approve" : "decline";

        setShowModal(true);
        setModalProps({
            heading:
                action === "APPROVED"
                    ? "Are you sure you want to approve this Pre-Award Requisition? The COR will send the Final Consensus Memo to the Procurement Shop and the agreement will be locked from editing until after it's awarded."
                    : "Are you sure you want to decline this agreement for Pre-Award? The COR will not send the Final Consensus Memo to the Procurement Shop until changes have been addressed and re-submitted for approval.",
            actionButtonText: action === "APPROVED" ? "Approve" : "Decline",
            secondaryButtonText: "Cancel",
            handleConfirm: async () => {
                setShowModal(false);
                setIsSubmitting(true);
                setSubmitError("");

                try {
                    // When declining, reset approval_requested to allow re-requesting
                    const updateData =
                        action === "DECLINED"
                            ? {
                                  approval_status: action,
                                  reviewer_notes: reviewerNotes.trim() || null,
                                  approval_requested: false
                              }
                            : {
                                  approval_status: action,
                                  reviewer_notes: reviewerNotes.trim() || null
                              };

                    await updateProcurementTrackerStep({
                        stepId: step5.id,
                        data: updateData
                    }).unwrap();

                    // Allow navigation after successful action
                    setIsNavigating(true);

                    // Show alert and navigate back to For Review tab
                    setAlert({
                        type: action === "APPROVED" ? "success" : "error",
                        heading:
                            action === "APPROVED" ? "Pre-Award Approved & Requisition Started" : "Pre-Award Declined",
                        message:
                            action === "APPROVED"
                                ? `The "${agreement.display_name}" agreement has been successfully approved for Pre-Award. Next, the Budget Team will submit the requisition and then the COR will be notified to upload the Final Consensus Memo to the HHS Consolidated Acquisition Solution (HCAS). The agreement will be locked from editing until after it's awarded.${
                                      reviewerNotes ? `\n\nNotes: ${reviewerNotes}` : ""
                                  }`
                                : `The "${agreement.display_name}" agreement has been declined for Pre Award. The budget team will not submit the requisition and the COR will not upload the Final Consensus Memo to the HHS Consolidated Acquisition Solution (HCAS) until changes have been addressed and re-submitted for approval.${
                                      reviewerNotes ? `\n\nNotes: ${reviewerNotes}` : ""
                                  }`,
                        redirectUrl: "/agreements?filter=change-requests"
                    });
                } catch (error) {
                    setSubmitError(
                        // @ts-expect-error - RTK Query error has data property
                        error?.data?.error || `Failed to ${actionText} approval request. Please try again.`
                    );
                    setIsSubmitting(false);
                }
            }
        });
    };

    const handleApprove = () => handleAction("APPROVED");
    const handleDecline = () => handleAction("DECLINED");

    const handleCancel = () => {
        if (!hasChanged) {
            // No changes, navigate immediately
            navigate("/agreements?filter=change-requests");
            return;
        }

        setShowModal(true);
        setModalProps({
            heading:
                "Are you sure you want to cancel? This will exit the review process and you can come back to it later.",
            actionButtonText: "Cancel",
            secondaryButtonText: "Continue Reviewing",
            handleConfirm: () => {
                setShowModal(false);
                flushSync(() => {
                    setIsNavigating(true);
                });
                navigate("/agreements?filter=change-requests");
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
        reviewerNotes,
        setReviewerNotes,
        requestorNotes,
        handleApprove,
        handleDecline,
        handleCancel,
        projectOfficerName,
        alternateProjectOfficerName,
        servicesComponents,
        groupedBudgetLinesByServicesComponent,
        preAwardMemoDocuments,
        showModal,
        setShowModal,
        modalProps,
        isSubmitting,
        submitError,
        hasPermission,
        approvalAlreadyProcessed,
        preAwardRequestorName,
        preAwardApprovalRequestedDate
    };
}
