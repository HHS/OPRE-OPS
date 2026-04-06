import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, shallowEqual } from "react-redux";
import {
    useGetAgreementByIdQuery,
    useGetServicesComponentsListQuery,
    useUpdateProcurementTrackerStepMutation,
    useGetDocumentsByAgreementIdQuery,
    useGetProcurementTrackersByAgreementIdQuery
} from "../../../api/opsAPI";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import { groupByServicesComponent, budgetLinesTotal } from "../../../helpers/budgetLines.helpers";
import useAlert from "../../../hooks/use-alert.hooks";

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

    // Use separate selectors with shallowEqual to prevent infinite loops
    // @ts-expect-error - Redux state typing in JS files
    const userId = useSelector((state) => state.auth?.activeUser?.id) ?? null;
    // @ts-expect-error - Redux state typing in JS files
    const userRoles = useSelector((state) => state.auth?.activeUser?.roles ?? [], shallowEqual);

    const { data: agreement, isLoading } = useGetAgreementByIdQuery(agreementId);
    const [updateProcurementTrackerStep] = useUpdateProcurementTrackerStepMutation();
    const { data: servicesComponents } = useGetServicesComponentsListQuery(agreementId, { skip: !agreementId });
    const { data: documentsData } = useGetDocumentsByAgreementIdQuery(agreementId, { skip: !agreementId });
    const { data: procurementTrackersData } = useGetProcurementTrackersByAgreementIdQuery(agreementId, {
        skip: !agreementId
    });

    const projectOfficerName = useGetUserFullNameFromId(agreement?.project_officer_id);
    const alternateProjectOfficerName = useGetUserFullNameFromId(agreement?.alternate_project_officer_id);

    // Get all budget lines for display (pre-award happens before IN_EXECUTION status)
    const allBudgetLines = useMemo(() => agreement?.budget_line_items ?? [], [agreement?.budget_line_items]);

    // Get executing budget lines for total calculation
    const executingBudgetLines = useMemo(
        () =>
            agreement?.budget_line_items?.filter(/** @param {any} bli */ (bli) => bli.status === "IN_EXECUTION") ?? [],
        [agreement?.budget_line_items]
    );

    // Calculate total of executing budget lines only
    const executingTotal = useMemo(() => budgetLinesTotal(executingBudgetLines), [executingBudgetLines]);

    // Group all budget lines by services component for display
    const groupedBudgetLinesByServicesComponent = groupByServicesComponent(allBudgetLines, servicesComponents || []);

    // Get Step 5 (Pre-Award) from procurement tracker
    const trackers = procurementTrackersData?.data || [];
    const activeTracker = trackers.find(/** @param {any} tracker */ (tracker) => tracker.status === "ACTIVE");
    const step5 = activeTracker?.steps?.find(/** @param {any} step */ (step) => step.step_number === 5);

    const preAwardRequestorName = useGetUserFullNameFromId(step5?.approval_requested_by);

    // Get existing Pre-Award Consensus Memo documents
    const preAwardMemoDocuments =
        documentsData?.documents?.filter(
            /** @param {any} doc */ (doc) => doc.document_type === "PRE_AWARD_CONSENSUS_MEMO"
        ) || [];

    // Get submitter's notes
    const requestorNotes = step5?.requestor_notes || "";

    // Check if approval already processed (returns boolean, not null)
    const approvalAlreadyProcessed = Boolean(step5?.approval_status && step5.approval_status !== "PENDING");

    // Permission check: user is Division Director, Deputy Director, Budget Team, or System Owner
    const hasPermission = useMemo(() => {
        const userRoleNames = userRoles.map(/** @param {any} role */ (role) => role?.name);

        const hasRequiredRole =
            userRoleNames.includes("BUDGET_TEAM") ||
            userRoleNames.includes("SYSTEM_OWNER") ||
            userRoleNames.includes("REVIEWER_APPROVER");

        if (!hasRequiredRole) return false;

        // For BUDGET_TEAM and SYSTEM_OWNER, permission granted
        if (userRoleNames.includes("BUDGET_TEAM") || userRoleNames.includes("SYSTEM_OWNER")) {
            return true;
        }

        // For REVIEWER_APPROVER, check if user is division director/deputy for any CAN in ALL budget lines
        // (Pre-award approval happens before budget lines reach IN_EXECUTION status)
        if (userRoleNames.includes("REVIEWER_APPROVER")) {
            return allBudgetLines.some(
                /** @param {any} bli */ (bli) =>
                    bli.can?.portfolio?.division?.division_director_id === userId ||
                    bli.can?.portfolio?.division?.deputy_division_director_id === userId
            );
        }

        return false;
    }, [userRoles, userId, allBudgetLines]);

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

                    // Show alert and navigate back to For Review tab
                    setAlert({
                        type: action === "APPROVED" ? "success" : "error",
                        heading: `Pre-Award ${action === "APPROVED" ? "Approved" : "Declined"}`,
                        message: `You have successfully ${actionText}d the pre-award approval request for ${agreement.display_name}.${
                            reviewerNotes ? `\n\nNotes: ${reviewerNotes}` : ""
                        }`,
                        redirectUrl: "/agreements?filter=change-requests"
                    });
                } catch (error) {
                    console.error(`Failed to ${actionText} approval request:`, error);
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
        setShowModal(true);
        setModalProps({
            heading:
                "Are you sure you want to cancel? This will exit the review process and you can come back to it later.",
            actionButtonText: "Cancel",
            secondaryButtonText: "Continue Reviewing",
            handleConfirm: () => {
                setShowModal(false);
                navigate("/agreements?filter=change-requests");
            }
        });
    };

    return {
        agreement,
        isLoading,
        executingBudgetLines: allBudgetLines, // Return all budget lines for display
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
        preAwardApprovalRequestedDate: step5?.approval_requested_date
    };
}
