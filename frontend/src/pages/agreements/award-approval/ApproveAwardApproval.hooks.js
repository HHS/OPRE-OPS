import { useState, useMemo } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useSelector, shallowEqual } from "react-redux";
import { useUpdateProcurementTrackerStepMutation } from "../../../api/opsAPI";
import useAlert from "../../../hooks/use-alert.hooks";
import useUnsavedChangesBlocker from "../../../hooks/useUnsavedChangesBlocker.hooks";
import usePreAwardApprovalData from "../pre-award-approval/usePreAwardApprovalData";
import DatePicker from "../../../components/UI/USWDS/DatePicker";
import { formatDateForApi } from "../../../helpers/utils";
import suite from "./ApproveAwardApproval.suite";

const MemoizedDatePicker = DatePicker; // DatePicker is already React.memo'd at source

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

    // Vest suite state. The suite is a module-level singleton, so its errors persist across
    // unmount/remount. Track the result in component state (seeded from suite.get()) and only
    // update it via runValidate, so a fresh mount does not surface stale errors from a prior visit.
    const [validatorRes, setValidatorRes] = useState(suite.get());

    /**
     * Run validation for a single field and update the shared suite state.
     * @param {string} name
     * @param {any} value
     */
    const runValidate = (name, value) => {
        suite.run({ [name]: value }, name);
        setValidatorRes(suite.get());
    };

    // The Approve Award button must stay disabled until a valid Obligated Date is entered.
    // The date must never be assumed to be today — it is generally documented first in another system.
    const isObligatedDateInvalid = !obligatedDate || validatorRes.hasErrors("obligatedDate");

    /**
     * Track unsaved changes — obligated date is the only editable field
     */
    const hasChanged = useMemo(() => !isNavigating && obligatedDate !== "", [isNavigating, obligatedDate]);

    /**
     * Navigation blocker — "Save changes before leaving?" pattern, no draft save option.
     * Primary: "Go back" (stay). Secondary: "Leave without saving" (discard + proceed).
     */
    const { showBlockerModal, setShowBlockerModal, blockerModalProps } = useUnsavedChangesBlocker({
        hasChanged,
        heading: "Save changes before leaving?",
        description:
            "You have unsaved changes in this award approval review. If you leave without completing this review, these changes will be lost.",
        actionButtonText: "Go back",
        secondaryButtonText: "Leave without saving"
    });

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
                            ...(obligatedDate ? { obligated_date: formatDateForApi(obligatedDate) } : {})
                        }
                    }).unwrap();

                    // Canonical success pattern (per CLAUDE.md + ReviewBudgetTeamRequisition)
                    flushSync(() => {
                        setIsNavigating(true);
                    });
                    setAlert({
                        type: "success",
                        heading: "Agreement Approved for Award",
                        message: `Agreement "${agreement?.display_name}" has been successfully approved for Award.`,
                        redirectUrl: "/agreements?filter=change-requests"
                    });
                } catch (error) {
                    setSubmitError(/** @type {any} */ (error)?.data?.error || "Failed to approve award");
                    setIsSubmitting(false);
                }
            }
        });
    };

    /**
     * Cancel handler — explicit user-initiated cancel from the page Cancel button
     */
    const handleCancel = () => {
        setShowModal(true);
        setModalProps({
            heading:
                "Are you sure you want to cancel? This will exit the review process and you can come back to it later.",
            actionButtonText: "Cancel",
            secondaryButtonText: "Continue Reviewing",
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
        obligatedDate,
        setObligatedDate,
        runValidate,
        validatorRes,
        isObligatedDateInvalid,
        MemoizedDatePicker,
        showModal,
        setShowModal,
        modalProps,
        showBlockerModal,
        setShowBlockerModal,
        blockerModalProps,
        isSubmitting,
        submitError,
        handleApprove,
        handleCancel,
        hasPermission,
        approvalAlreadyProcessed
    };
}
