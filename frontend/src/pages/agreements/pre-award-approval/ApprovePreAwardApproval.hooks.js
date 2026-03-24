import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
    useGetAgreementByIdQuery,
    useGetServicesComponentsListQuery,
    useUpdateProcurementTrackerStepMutation,
    useGetDocumentsByAgreementIdQuery,
    useGetProcurementTrackersByAgreementIdQuery
} from "../../../api/opsAPI";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import { groupByServicesComponent } from "../../../helpers/budgetLines.helpers";
import useAlert from "../../../hooks/use-alert.hooks";

/**
 * Custom hook for the ApprovePreAwardApproval page.
 * @param {number} agreementId - The agreement ID.
 * @returns {object} Hook state and functions.
 */
export default function useApprovePreAwardApproval(agreementId) {
    const navigate = useNavigate();
    const { setAlert } = useAlert();
    const [reviewerNotes, setReviewerNotes] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalProps, setModalProps] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const userId = useSelector((state) => state.auth?.activeUser?.id) ?? null;
    const userRoles = useSelector((state) => state.auth?.activeUser?.roles) ?? [];

    const { data: agreement, isLoading } = useGetAgreementByIdQuery(agreementId);
    const [updateProcurementTrackerStep] = useUpdateProcurementTrackerStepMutation();
    const { data: servicesComponents } = useGetServicesComponentsListQuery(agreementId, { skip: !agreementId });
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

    // Get Step 5 (Pre-Award) from procurement tracker
    const trackers = procurementTrackersData?.data || [];
    const activeTracker = trackers.find((tracker) => tracker.status === "ACTIVE");
    const step5 = activeTracker?.steps?.find((step) => step.step_number === 5);

    // Get existing Pre-Award Consensus Memo documents
    const preAwardMemoDocuments =
        documentsData?.documents?.filter((doc) => doc.document_type === "PRE_AWARD_CONSENSUS_MEMO") || [];

    // Get submitter's notes
    const requestorNotes = step5?.requestor_notes || "";

    // Check if approval already processed
    const approvalAlreadyProcessed = step5?.approval_status && step5.approval_status !== "PENDING";

    // Permission check: user is Division Director, Deputy Director, Budget Team, or System Owner
    const hasPermission = useMemo(() => {
        // Check if user has required roles
        const userRoleNames = userRoles.map((role) => role?.name);
        const hasRequiredRole =
            userRoleNames.includes("BUDGET_TEAM") ||
            userRoleNames.includes("SYSTEM_OWNER") ||
            userRoleNames.includes("REVIEWER_APPROVER");

        if (!hasRequiredRole) return false;

        // For BUDGET_TEAM and SYSTEM_OWNER, permission granted
        if (userRoleNames.includes("BUDGET_TEAM") || userRoleNames.includes("SYSTEM_OWNER")) {
            return true;
        }

        // For REVIEWER_APPROVER, check if user is division director/deputy for any CAN in executing budget lines
        if (userRoleNames.includes("REVIEWER_APPROVER")) {
            return executingBudgetLines.some(
                (bli) =>
                    bli.can?.portfolio?.division?.division_director_id === userId ||
                    bli.can?.portfolio?.division?.deputy_division_director_id === userId
            );
        }

        return false;
    }, [userRoles, userId, executingBudgetLines]);

    const handleAction = async (action) => {
        if (!step5?.id) {
            setSubmitError("Step 5 not found. Cannot process approval request.");
            return;
        }

        const actionText = action === "APPROVED" ? "approve" : "decline";

        setShowModal(true);
        setModalProps({
            heading: `Are you sure you want to ${actionText} this pre-award request?`,
            actionButtonText: action === "APPROVED" ? "Approve" : "Decline",
            secondaryButtonText: "Cancel",
            handleConfirm: async () => {
                setShowModal(false);
                setIsSubmitting(true);
                setSubmitError("");

                try {
                    await updateProcurementTrackerStep({
                        stepId: step5.id,
                        data: {
                            approval_status: action,
                            reviewer_notes: reviewerNotes.trim() || null
                        }
                    }).unwrap();

                    // Show success alert and navigate
                    setAlert({
                        type: "success",
                        heading: `Pre-Award ${action === "APPROVED" ? "Approved" : "Declined"}`,
                        message: `You have successfully ${actionText}d the pre-award approval request for ${agreement.display_name}.${
                            reviewerNotes ? `\n\nNotes: ${reviewerNotes}` : ""
                        }`,
                        redirectUrl: "/agreements"
                    });
                } catch (error) {
                    console.error(`Failed to ${actionText} approval request:`, error);
                    setSubmitError(
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
        navigate(-1);
    };

    return {
        agreement,
        isLoading,
        executingBudgetLines,
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
        approvalAlreadyProcessed
    };
}
