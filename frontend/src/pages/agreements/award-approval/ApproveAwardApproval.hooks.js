import React, { useState, useMemo, useEffect } from "react";
import { flushSync } from "react-dom";
import { useNavigate, useBlocker } from "react-router-dom";
import { useSelector, shallowEqual } from "react-redux";
import { useUpdateProcurementTrackerStepMutation } from "../../../api/opsAPI";
import useAlert from "../../../hooks/use-alert.hooks";
import usePreAwardApprovalData from "../pre-award-approval/usePreAwardApprovalData";
import DatePicker from "../../../components/UI/USWDS/DatePicker";
import { formatDateForApi } from "../../../helpers/utils";
import { scrollToTop } from "../../../helpers/scrollToTop.helper";

const MemoizedDatePicker = React.memo(DatePicker);

/**
 * Custom hook for the ApproveAwardApproval (Budget Team) review page.
 * Mirrors ReviewBudgetTeamRequisition.hooks.js but targets step 6 (AWARD).
 * @param {number} agreementId
 * @returns {Object}
 */
export default function useApproveAwardApproval(agreementId) {
    const navigate = useNavigate();
    const { setAlert } = useAlert();

    // Form state
    const [reviewerNotes, setReviewerNotes] = useState("");
    const [obligatedDate, setObligatedDate] = useState("");

    // UI state
    const [showModal, setShowModal] = useState(false);
    const [modalProps, setModalProps] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [isNavigating, setIsNavigating] = useState(false);

    // Auth
    // @ts-expect-error - Redux state typing in JS files
    const userRoles = useSelector((state) => state.auth?.activeUser?.roles ?? [], shallowEqual);

    const [updateProcurementTrackerStep] = useUpdateProcurementTrackerStepMutation();

    // Fetch data using shared hook (extended to include step6)
    const {
        agreement,
        isLoading,
        allBudgetLines,
        executingTotal,
        projectOfficerName,
        alternateProjectOfficerName,
        servicesComponents,
        groupedBudgetLinesByServicesComponent,
        step6,
        requestorName,
        requestorDate
    } = usePreAwardApprovalData(agreementId);

    const requestorNotes = step6?.requestor_notes || "";

    // Check if already approved
    const approvalAlreadyProcessed = Boolean(
        step6?.approval_status && step6.approval_status !== "PENDING" && step6.approval_status !== null
    );

    // Permission check: BUDGET_TEAM or SYSTEM_OWNER (same as ReviewBudgetTeamRequisition)
    const hasPermission = useMemo(() => {
        const userRoleNames = userRoles.map(/** @param {any} role */ (role) => role?.name);
        return userRoleNames.includes("BUDGET_TEAM") || userRoleNames.includes("SYSTEM_OWNER");
    }, [userRoles]);

    /**
     * Track unsaved changes
     */
    const hasChanged = useMemo(() => {
        return reviewerNotes.trim() !== "" || obligatedDate !== "";
    }, [reviewerNotes, obligatedDate]);

    /**
     * Navigation blocker — prevents accidental navigation when form has unsaved changes
     */
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            !isNavigating && hasChanged && currentLocation.pathname !== nextLocation.pathname
    );

    useEffect(() => {
        if (blocker.state === "blocked") {
            setShowModal(true);
            setModalProps({
                heading: "Are you sure you want to cancel this task? Your input will not be saved.",
                actionButtonText: "Yes, Cancel Task",
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

    /**
     * Approve handler — opens confirmation modal, then PATCHes step 6
     */
    const handleApprove = () => {
        if (!step6?.id) {
            setSubmitError("Unable to submit: procurement tracker step not found");
            return;
        }

        setShowModal(true);
        setModalProps({
            heading:
                "Are you sure you want to approve this agreement for Award? This will change the budget lines in Executing Status to Obligated Status, and budget lines in Planned Status to Planned Mod Status.",
            actionButtonText: "Approve",
            secondaryButtonText: "Cancel",
            handleConfirm: async () => {
                setShowModal(false);
                setIsSubmitting(true);
                setSubmitError("");

                try {
                    await updateProcurementTrackerStep({
                        stepId: step6.id,
                        data: {
                            approval_status: "APPROVED",
                            reviewer_notes: reviewerNotes.trim() || null,
                            ...(obligatedDate ? { obligated_date: formatDateForApi(obligatedDate) } : {})
                        }
                    }).unwrap();

                    // Canonical success pattern (per CLAUDE.md + ReviewBudgetTeamRequisition)
                    setAlert({
                        type: "success",
                        heading: "Agreement Approved for Award",
                        message: `Agreement "${agreement?.display_name}" has been successfully approved for Award.`
                    });
                    scrollToTop();
                    flushSync(() => {
                        setIsNavigating(true);
                    });
                    navigate("/agreements?filter=change-requests");
                } catch (error) {
                    setSubmitError(/** @type {any} */ (error)?.data?.error || "Failed to approve award");
                    setIsSubmitting(false);
                }
            }
        });
    };

    /**
     * Cancel handler
     */
    const handleCancel = () => {
        setShowModal(true);
        setModalProps({
            heading: "Are you sure you want to cancel this task? Your input will not be saved.",
            actionButtonText: "Yes, Cancel Task",
            secondaryButtonText: "Continue Editing",
            handleConfirm: () => {
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
        allBudgetLines,
        executingTotal,
        projectOfficerName,
        alternateProjectOfficerName,
        servicesComponents,
        groupedBudgetLinesByServicesComponent,
        step6,
        requestorNotes,
        requestorName,
        requestorDate,
        reviewerNotes,
        setReviewerNotes,
        obligatedDate,
        setObligatedDate,
        MemoizedDatePicker,
        showModal,
        setShowModal,
        modalProps,
        isSubmitting,
        submitError,
        handleApprove,
        handleCancel,
        hasPermission,
        approvalAlreadyProcessed
    };
}
