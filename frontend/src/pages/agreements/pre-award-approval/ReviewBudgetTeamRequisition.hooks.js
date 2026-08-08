import React, { useState, useMemo, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import { useNavigate, useBlocker } from "react-router-dom";
import { useSelector, shallowEqual } from "react-redux";
import { useUpdateProcurementTrackerStepMutation } from "../../../api/opsAPI";
import useAlert from "../../../hooks/use-alert.hooks";
import usePreAwardApprovalData from "./usePreAwardApprovalData";
import DatePicker from "../../../components/UI/USWDS/DatePicker";
import { formatDateForApi, formatDateForScreen } from "../../../helpers/utils";
import { scrollToTop } from "../../../helpers/scrollToTop.helper";

const MemoizedDatePicker = React.memo(DatePicker);
const DATE_FORMAT_REGEX = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;

/**
 * Custom hook for the ReviewBudgetTeamRequisition page.
 * @param {number} agreementId - The agreement ID.
 * @returns {{
 *   agreement: any,
 *   isLoading: boolean,
 *   allBudgetLines: any[],
 *   executingBudgetLines: any[],
 *   executingTotal: number,
 *   projectOfficerName: string,
 *   alternateProjectOfficerName: string,
 *   servicesComponents: any[],
 *   groupedBudgetLinesByServicesComponent: any[],
 *   groupedExecutingBudgetLinesByServicesComponent: any[],
 *   preAwardMemoDocuments: any[],
 *   requestorNotes: string,
 *   reviewerNotes: string,
 *   preAwardRequestorName: string,
 *   preAwardApprovalRequestedDate: string,
 *   requisitionNumber: string,
 *   setRequisitionNumber: (value: string) => void,
 *   requisitionDate: string,
 *   setRequisitionDate: (value: string) => void,
 *   handleDateChange: (e: any) => void,
 *   requisitionDateError: string[],
 *   attestationChecked: boolean,
 *   setAttestationChecked: (value: boolean) => void,
 *   MemoizedDatePicker,
 *   showModal: boolean,
 *   setShowModal: (value: boolean) => void,
 *   modalProps: any,
 *   isSubmitting: boolean,
 *   submitError: string,
 *   handleApprove: () => void,
 *   handleSaveDraft: () => void,
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
    const [isNavigating, setIsNavigating] = useState(false);
    const [requisitionDateError, setRequisitionDateError] = useState([]);

    // Auth - use separate selectors with shallowEqual to prevent infinite loops
    // @ts-expect-error - Redux state typing in JS files
    const userRoles = useSelector((state) => state.auth?.activeUser?.roles ?? [], shallowEqual);

    const [updateProcurementTrackerStep] = useUpdateProcurementTrackerStepMutation();

    // Fetch data using shared hook
    const {
        agreement,
        isLoading: isLoadingAgreement,
        isLoadingTrackers,
        allBudgetLines,
        executingBudgetLines,
        executingTotal,
        projectOfficerName,
        alternateProjectOfficerName,
        servicesComponents,
        groupedExecutingBudgetLinesByServicesComponent,
        preAwardMemoDocuments,
        step5,
        preAwardRequestorName,
        preAwardApprovalRequestedDate
    } = usePreAwardApprovalData(agreementId);

    const isLoading = isLoadingAgreement || isLoadingTrackers;

    const requestorNotes = step5?.requestor_notes || "";
    const reviewerNotes = step5?.reviewer_notes || "";

    // Load saved draft values when step5 data arrives — always set both fields
    // so stale empty state can't overwrite previously-saved values before this effect fires
    useEffect(() => {
        if (step5) {
            setRequisitionNumber(step5.requisition_number || "");
            if (step5.requisition_date) {
                const displayDate = formatDateForScreen(step5.requisition_date);
                setRequisitionDate(displayDate || "");
            } else {
                setRequisitionDate("");
            }
        }
    }, [step5]);

    // Check if already processed
    const approvalAlreadyProcessed = step5?.requisition_approved_by != null;

    // Permission check: BUDGET_TEAM or SYSTEM_OWNER
    const hasPermission = useMemo(() => {
        const userRoleNames = userRoles.map(/** @param {any} role */ (role) => role?.name);
        return userRoleNames.includes("BUDGET_TEAM") || userRoleNames.includes("SYSTEM_OWNER");
    }, [userRoles]);

    // Form validation — uses the same strict regex as handleDateChange for consistency
    const isFormValid = () =>
        requisitionNumber.trim() !== "" && DATE_FORMAT_REGEX.test(requisitionDate) && attestationChecked;

    // Validate date format on change — only show error when something is entered but invalid
    const handleDateChange = useCallback((/** @param {any} e */ e) => {
        const value = e.target.value;
        setRequisitionDate(value);
        if (value.trim() !== "" && !DATE_FORMAT_REGEX.test(value)) {
            setRequisitionDateError(["Date must be MM/DD/YYYY"]);
        } else {
            setRequisitionDateError([]);
        }
    }, []);

    /**
     * Track if any changes have been made to the form
     */
    // attestationChecked is a UI gate, not a persisted draft field — exclude it so
    // checking the box alone does not trigger the nav-away blocker.
    const hasChanged = useMemo(() => {
        return requisitionNumber.trim() !== "" || requisitionDate !== "";
    }, [requisitionNumber, requisitionDate]);

    const canSaveDraft = useMemo(() => {
        const dateIsValidIfEntered = !requisitionDate.trim() || DATE_FORMAT_REGEX.test(requisitionDate);
        const hasCurrentValues = requisitionNumber.trim() !== "" || requisitionDate.trim() !== "";
        const hasPriorValues = Boolean(step5?.requisition_number || step5?.requisition_date);
        return dateIsValidIfEntered && (hasCurrentValues || hasPriorValues);
    }, [requisitionNumber, requisitionDate, step5]);

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
                heading: "Save changes before leaving?",
                description:
                    "You have unsaved changes in the pre-award requisition. If you leave without saving, these changes will be lost.",
                actionButtonText: "Save Changes",
                secondaryButtonText: "Leave without saving",
                handleConfirm: () => {
                    setShowModal(false);
                    if (!canSaveDraft) {
                        // Nothing to save (e.g. invalid date) — just leave without saving
                        // so the user is not stranded with a permanently cancelled navigation.
                        flushSync(() => {
                            setIsNavigating(true);
                        });
                        blocker.proceed?.();
                        return;
                    }
                    blocker.reset?.();
                    handleSaveDraft();
                },
                handleSecondary: () => {
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [blocker.state, blocker]);

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
                            requisition_date: formatDateForApi(requisitionDate)
                            // requisition_approved_by is server-controlled and set automatically
                        }
                    }).unwrap();

                    // Allow navigation after successful approval
                    setAlert({
                        type: "success",
                        heading: "Pre-Award Requisition approved",
                        message: `"${agreement?.name}" agreement has been successfully approved for Pre-Award Requisition. The COR will be notified to upload the Final Consensus Memo to the HHS Consolidated Acquisition Solution (HCAS). The agreement will be locked from editing until after it's awarded.`
                    });
                    scrollToTop();
                    // Use flushSync to ensure state update completes before navigation
                    flushSync(() => {
                        setIsNavigating(true);
                    });
                    navigate("/agreements?filter=change-requests");
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
        const nothingToSave = !requisitionNumber.trim() && !requisitionDate.trim();
        const noPriorValues = !step5?.requisition_number && !step5?.requisition_date;
        if (nothingToSave && noPriorValues) {
            setSubmitError("Enter a Requisition # or Date to save a draft.");
            return;
        }

        if (!step5?.id) {
            setSubmitError("Unable to save: procurement tracker step not found");
            return;
        }

        setIsSubmitting(true);
        setSubmitError("");

        try {
            // Validate date format if a date was entered — use strict regex consistent with handleDateChange
            let formattedDate = null;
            if (requisitionDate.trim()) {
                if (!DATE_FORMAT_REGEX.test(requisitionDate)) {
                    setSubmitError("Invalid date format. Please use MM/DD/YYYY format.");
                    setIsSubmitting(false);
                    return;
                }
                formattedDate = formatDateForApi(requisitionDate);
            }

            /** @type {Record<string, any>} */
            const data = {
                is_draft: true,
                requisition_number: requisitionNumber.trim() || null,
                requisition_date: formattedDate
            };

            await updateProcurementTrackerStep({
                stepId: step5.id,
                data
            }).unwrap();

            // Allow navigation after successful save
            // Success: Show success message and redirect
            setAlert({
                type: "success",
                heading: "Draft saved",
                message: "Requisition information has been saved. You can return later to complete the approval."
            });
            scrollToTop();
            // Use flushSync to ensure state update completes before navigation
            flushSync(() => {
                setIsNavigating(true);
            });
            navigate("/agreements?filter=change-requests");

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
            heading:
                "Are you sure you want to cancel? This will exit the review process and you can come back to it later.",
            description: "",
            actionButtonText: "Cancel",
            secondaryButtonText: "Continue Reviewing",
            handleConfirm: () => {
                flushSync(() => {
                    setIsNavigating(true);
                });
                navigate("/agreements?filter=change-requests");
            },
            handleSecondary: () => {
                setShowModal(false);
            },
            closeModal: () => {
                setShowModal(false);
            }
        });
    };

    return {
        // Data
        agreement,
        isLoading: isLoading || isLoadingTrackers,
        allBudgetLines,
        executingBudgetLines,
        executingTotal,
        projectOfficerName,
        alternateProjectOfficerName,
        servicesComponents,
        groupedExecutingBudgetLinesByServicesComponent,
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
        handleDateChange,
        requisitionDateError,
        attestationChecked,
        setAttestationChecked,
        MemoizedDatePicker,

        // UI state
        showModal,
        setShowModal,
        modalProps,
        isSubmitting,
        submitError,
        setSubmitError,

        // Handlers
        handleApprove,
        handleSaveDraft,
        handleCancel,
        isFormValid,

        // Permissions
        hasPermission,
        approvalAlreadyProcessed,
        canSaveDraft
    };
}
