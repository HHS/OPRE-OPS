import React, { useState, useMemo } from "react";
import { useNavigate, useBlocker } from "react-router-dom";
import {
    useGetAgreementByIdQuery,
    useGetProcurementTrackersByAgreementIdQuery,
    useUpdateProcurementTrackerStepMutation,
    useGetServicesComponentsListQuery,
    useGetVendorsQuery,
    useUpdateBudgetLineItemMutation
} from "../../../api/opsAPI";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import { getLocalISODate, formatDateForApi } from "../../../helpers/utils";
import { groupByServicesComponent } from "../../../helpers/budgetLines.helpers";
import { PROCUREMENT_STEP_STATUS } from "../../../components/Agreements/ProcurementTracker/ProcurementTracker.constants";
import DatePicker from "../../../components/UI/USWDS/DatePicker";
import suite from "./RequestAwardApproval.suite";

// Memoize DatePicker outside the hook to avoid recreating on every render
const MemoizedDatePicker = React.memo(DatePicker);

/**
 * Custom hook for the Request Award Approval page
 * @param {number} agreementId - The agreement ID
 * @returns {Object} - Hook state and handlers
 */
export default function useRequestAwardApproval(agreementId) {
    const navigate = useNavigate();
    const [notes, setNotes] = useState("");
    const [submitError, setSubmitError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal state for cancel confirmation and navigation blocking
    const [showModal, setShowModal] = useState(false);
    const [modalProps, setModalProps] = useState({});
    const [isNavigating, setIsNavigating] = useState(false);

    // CLIN assignments (budgetLineId -> clinNumber mapping)
    const [clinAssignments, setClinAssignments] = useState({});

    // Vendor Information fields
    const [selectedVendor, setSelectedVendor] = useState(null); // {id, name, duns}

    // Award Information fields
    const [contractNumber, setContractNumber] = useState("");
    const [awardAmount, setAwardAmount] = useState("");
    const [awardDate, setAwardDate] = useState("");

    // Validation
    const [validationResult, setValidationResult] = useState(suite.get());

    const [updateProcurementTrackerStep] = useUpdateProcurementTrackerStepMutation();
    const [updateBudgetLineItem] = useUpdateBudgetLineItemMutation();

    // Fetch vendors
    const { data: vendors = [], isLoading: isLoadingVendors } = useGetVendorsQuery();

    // Fetch agreement data
    const { data: agreement, isLoading: isLoadingAgreement } = useGetAgreementByIdQuery(agreementId, {
        refetchOnMountOrArgChange: true
    });

    // Fetch procurement tracker data
    const { data: trackersData, isLoading: isLoadingTrackers } = useGetProcurementTrackersByAgreementIdQuery(
        agreementId,
        {
            skip: !agreementId,
            refetchOnMountOrArgChange: true
        }
    );

    // Fetch services components
    const { data: servicesComponents } = useGetServicesComponentsListQuery(agreementId, { skip: !agreementId });

    // Get active tracker and steps
    const trackers = trackersData?.data || [];
    const activeTracker = trackers.find((tracker) => tracker.status === "ACTIVE");
    const step5 = activeTracker?.steps?.find((/** @type {any} */ step) => step.step_number === 5);
    const step6 = activeTracker?.steps?.find((/** @type {any} */ step) => step.step_number === 6);

    // Get project officer names
    const projectOfficerName = useGetUserFullNameFromId(agreement?.project_officer_id);
    const alternateProjectOfficerName = useGetUserFullNameFromId(agreement?.alternate_project_officer_id);

    // Get all budget lines for display
    // Memoized to prevent reference changes on every render
    const allBudgetLines = useMemo(() => agreement?.budget_line_items ?? [], [agreement?.budget_line_items]);

    // Group all budget lines by services component for display
    // Memoized to avoid expensive re-computation on every render
    const groupedBudgetLinesByServicesComponent = useMemo(
        () => groupByServicesComponent(allBudgetLines, servicesComponents || []),
        [allBudgetLines, servicesComponents]
    );

    // Create a lookup map for services components to avoid repeated array searches
    // Each component in the map is indexed by its grouping label
    const servicesComponentLookup = useMemo(() => {
        if (!servicesComponents) return new Map();
        return new Map(
            servicesComponents.map((sc) => {
                const scGroupingLabel = sc.sub_component ? `${sc.number}-${String(sc.sub_component)}` : `${sc.number}`;
                return [scGroupingLabel, sc];
            })
        );
    }, [servicesComponents]);

    // Check if Step 5 is completed (prerequisite)
    const isStep5Completed = step5?.status === PROCUREMENT_STEP_STATUS.COMPLETED;

    // Check if approval has been requested
    const hasApprovalBeenRequested = step6?.approval_requested === true;

    // Check if any BLI is in review status
    const hasBLIInReview = agreement?.budget_line_items?.some((/** @type {any} */ bli) => bli.in_review) ?? false;

    const isLoading = isLoadingAgreement || isLoadingTrackers || isLoadingVendors;

    /**
     * Track if any changes have been made to the form
     */
    const hasChanged = useMemo(() => {
        return (
            notes.trim() !== "" ||
            selectedVendor !== null ||
            contractNumber.trim() !== "" ||
            awardAmount !== "" ||
            awardDate !== "" ||
            Object.keys(clinAssignments).length > 0
        );
    }, [notes, selectedVendor, contractNumber, awardAmount, awardDate, clinAssignments]);

    /**
     * Navigation blocker - prevents accidental navigation when there are unsaved changes
     */
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            !isNavigating && hasChanged && currentLocation.pathname !== nextLocation.pathname
    );

    // Handle blocker state changes
    React.useEffect(() => {
        if (blocker.state === "blocked") {
            setShowModal(true);
            setModalProps({
                heading: "Are you sure you want to cancel? Your changes will not be saved.",
                actionButtonText: "Yes, Cancel",
                secondaryButtonText: "Continue Editing",
                handleConfirm: async () => {
                    setShowModal(false);
                    setIsNavigating(true);
                    // Small delay to let state update before proceeding
                    await new Promise((resolve) => setTimeout(resolve, 0));
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
     * Run validation for a specific field
     */
    const runValidate = (fieldName, value) => {
        suite.run({ [fieldName]: value }, fieldName);
        setValidationResult(suite.get());
    };

    /**
     * Handle form submission - request award approval
     */
    const handleSubmit = async () => {
        if (!step6?.id) {
            setSubmitError("Step 6 not found for this agreement.");
            return;
        }

        // Run validation on all fields before submitting
        const allData = {
            vendor: selectedVendor?.id,
            contractNumber,
            awardAmount,
            awardDate
        };
        suite.run(allData);
        const finalValidation = suite.get();

        if (finalValidation.hasErrors()) {
            setValidationResult(finalValidation);
            setSubmitError("Please correct the errors in the form before submitting.");
            return;
        }

        setIsSubmitting(true);
        setSubmitError("");

        try {
            // First, update all CLIN assignments for budget lines
            const clinUpdatePromises = Object.entries(clinAssignments).map(([budgetLineId, clinNumber]) =>
                updateBudgetLineItem({
                    id: parseInt(budgetLineId),
                    data: { clin_number: clinNumber }
                }).unwrap()
            );

            // Wait for all CLIN updates to complete
            if (clinUpdatePromises.length > 0) {
                await Promise.all(clinUpdatePromises);
            }

            // Then request award approval
            await updateProcurementTrackerStep({
                stepId: step6.id,
                data: {
                    approval_requested: true,
                    approval_requested_date: getLocalISODate(),
                    requestor_notes: notes.trim() || null,
                    vendor_id: selectedVendor?.id,
                    contract_number: contractNumber.trim(),
                    award_amount: parseFloat(awardAmount),
                    award_date: formatDateForApi(awardDate)
                }
            }).unwrap();

            // Allow navigation after successful submission
            setIsNavigating(true);
            navigate(`/agreements/${agreementId}/procurement-tracker`, {
                state: { awardApprovalSuccess: true }
            });
        } catch (error) {
            console.error("Failed to request award approval:", error);
            setSubmitError(error?.data?.message || "Failed to request award approval. Please try again.");
            setIsSubmitting(false);
        }
    };

    /**
     * Handle cancel - show confirmation modal before navigating away
     */
    const handleCancel = () => {
        if (!hasChanged) {
            // No changes, navigate immediately
            navigate(-1);
            return;
        }

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
        notes,
        setNotes,
        handleSubmit,
        handleCancel,
        submitError,
        isSubmitting,
        hasApprovalBeenRequested,
        hasBLIInReview,
        isStep5Completed,
        projectOfficerName,
        alternateProjectOfficerName,
        allBudgetLines,
        servicesComponents,
        servicesComponentLookup,
        groupedBudgetLinesByServicesComponent,
        vendors,
        selectedVendor,
        setSelectedVendor,
        contractNumber,
        setContractNumber,
        awardAmount,
        setAwardAmount,
        awardDate,
        setAwardDate,
        runValidate,
        validationResult,
        MemoizedDatePicker,
        clinAssignments,
        setClinAssignments,
        showModal,
        setShowModal,
        modalProps
    };
}
