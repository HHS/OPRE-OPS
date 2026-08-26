import React, { useState, useMemo, useEffect } from "react";
import { flushSync } from "react-dom";
import { useNavigate, useBlocker, useSearchParams } from "react-router-dom";
import {
    useGetAgreementByIdQuery,
    useGetProcurementTrackersByAgreementIdQuery,
    useUpdateProcurementTrackerStepMutation,
    useGetServicesComponentsListQuery,
    useGetVendorsQuery,
    useUpdateBudgetLineItemMutation
} from "../../../api/opsAPI";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import useAlert from "../../../hooks/use-alert.hooks";
import { formatDateForApi } from "../../../helpers/utils";
import { groupByServicesComponent } from "../../../helpers/budgetLines.helpers";
import DatePicker from "../../../components/UI/USWDS/DatePicker";
import suite from "./RequestAwardApproval.suite";

// Memoize DatePicker outside the hook to avoid recreating on every render
const MemoizedDatePicker = React.memo(DatePicker);

/**
 * Format a date string from the API (YYYY-MM-DD) into MM/DD/YYYY for the DatePicker.
 * Returns "" if the value is falsy.
 * @param {string|null|undefined} apiDate
 * @returns {string}
 */
const formatApiDateForDisplay = (apiDate) => {
    if (!apiDate) return "";
    // API returns YYYY-MM-DD; convert to MM/DD/YYYY
    const [year, month, day] = apiDate.split("-");
    if (!year || !month || !day) return "";
    return `${month}/${day}/${year}`;
};

/**
 * Custom hook for the Edit Award Approval page.
 *
 * Mirrors useRequestAwardApproval but seeds form fields from the already-submitted
 * step 6 data so the Budget Team can review and adjust before approving.
 * On save, the PATCH omits `approval_requested` — it edits the pending request without
 * re-submitting or changing the approval status.
 *
 * @param {number} agreementId
 * @returns {Object} Hook state and handlers
 */
export default function useEditAwardApproval(agreementId) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { setAlert } = useAlert();
    const [submitError, setSubmitError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSeeded, setIsSeeded] = useState(false);

    // Modal state for cancel confirmation and navigation blocking
    const [showModal, setShowModal] = useState(false);
    const [modalProps, setModalProps] = useState({});
    const [isNavigating, setIsNavigating] = useState(false);

    // CLIN assignments (budgetLineId -> clinNumber mapping)
    const [clinAssignments, setClinAssignments] = useState({});

    // Vendor Information field
    const [selectedVendor, setSelectedVendor] = useState(null);

    // Award Information fields
    const [contractNumber, setContractNumber] = useState("");
    const [awardAmount, setAwardAmount] = useState("");
    const [awardDate, setAwardDate] = useState("");
    const [notes, setNotes] = useState("");

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

    // Get active tracker and step 6
    const trackers = trackersData?.data || [];
    const activeTracker = trackers.find((tracker) => tracker.status === "ACTIVE");
    const step6 = activeTracker?.steps?.find((/** @type {any} */ step) => step.step_number === 6);

    // Get project officer names
    const projectOfficerName = useGetUserFullNameFromId(agreement?.project_officer_id);
    const alternateProjectOfficerName = useGetUserFullNameFromId(agreement?.alternate_project_officer_id);

    // Get all budget lines
    const allBudgetLines = useMemo(() => agreement?.budget_line_items ?? [], [agreement?.budget_line_items]);

    // Group budget lines by services component
    const groupedBudgetLinesByServicesComponent = useMemo(
        () => groupByServicesComponent(allBudgetLines, servicesComponents || []),
        [allBudgetLines, servicesComponents]
    );

    // Lookup map for services components
    const servicesComponentLookup = useMemo(() => {
        if (!servicesComponents) return new Map();
        return new Map(
            servicesComponents.map((sc) => {
                const scGroupingLabel = sc.sub_component ? `${sc.number}-${String(sc.sub_component)}` : `${sc.number}`;
                return [scGroupingLabel, sc];
            })
        );
    }, [servicesComponents]);

    const isLoading = isLoadingAgreement || isLoadingTrackers || isLoadingVendors;

    // Seed form fields from step 6 once data is available.
    // Run only once to avoid overwriting user edits on re-renders.
    useEffect(() => {
        if (isSeeded || !step6 || vendors.length === 0) return;

        if (step6.vendor_id) {
            const vendor = vendors.find((v) => v.id === step6.vendor_id);
            setSelectedVendor(vendor || null);
        }
        if (step6.contract_number) setContractNumber(step6.contract_number);
        if (step6.award_amount != null) setAwardAmount(String(step6.award_amount));
        if (step6.award_date) setAwardDate(formatApiDateForDisplay(step6.award_date));
        if (step6.requestor_notes) setNotes(step6.requestor_notes);

        // Seed CLIN assignments from existing budget-line clin_id values
        const existingClins = {};
        allBudgetLines.forEach((bli) => {
            if (bli.clin_id) {
                existingClins[bli.id] = bli.clin_id;
            }
        });
        if (Object.keys(existingClins).length > 0) {
            setClinAssignments(existingClins);
        }

        setIsSeeded(true);
    }, [isSeeded, step6, vendors, allBudgetLines]);

    /**
     * Track if any changes have been made compared to the seeded values.
     * We rely on isSeeded to avoid blocking navigation during initial load.
     */
    const hasChanged = useMemo(() => {
        if (!isSeeded) return false;
        const seededVendorId = step6?.vendor_id ?? null;
        const seededContract = step6?.contract_number ?? "";
        const seededAmount = step6?.award_amount != null ? String(step6.award_amount) : "";
        const seededDate = formatApiDateForDisplay(step6?.award_date);
        const seededNotes = step6?.requestor_notes ?? "";

        return (
            (selectedVendor?.id ?? null) !== seededVendorId ||
            contractNumber !== seededContract ||
            awardAmount !== seededAmount ||
            awardDate !== seededDate ||
            notes !== seededNotes ||
            // For CLINs, compare against the seeded assignments (only track newly added ones)
            Object.keys(clinAssignments).some(
                (bliId) =>
                    clinAssignments[bliId] !== (allBudgetLines.find((b) => b.id === Number(bliId))?.clin_id ?? null)
            )
        );
    }, [
        isSeeded,
        step6,
        selectedVendor,
        contractNumber,
        awardAmount,
        awardDate,
        notes,
        clinAssignments,
        allBudgetLines
    ]);

    /**
     * Navigation blocker — prevents accidental navigation with unsaved changes.
     */
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            !isNavigating && hasChanged && currentLocation.pathname !== nextLocation.pathname
    );

    React.useEffect(() => {
        if (blocker.state === "blocked") {
            setShowModal(true);
            setModalProps({
                heading: "Are you sure you want to leave? Your changes will not be saved.",
                actionButtonText: "Leave without saving",
                secondaryButtonText: "Continue editing",
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
     * Run validation for a specific field.
     */
    const runValidate = (fieldName, value) => {
        suite.run({ [fieldName]: value }, fieldName);
        setValidationResult(suite.get());
    };

    /**
     * Handle save — update award fields on the pending step 6 request.
     * Does NOT set approval_requested or approval_status.
     */
    const handleSave = async () => {
        if (!step6?.id) {
            setSubmitError("Step 6 not found for this agreement.");
            return;
        }

        // Run full validation before saving
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
            setSubmitError("Please correct the errors in the form before saving.");
            return;
        }

        setIsSubmitting(true);
        setSubmitError("");

        try {
            // Update any changed CLIN assignments
            const clinUpdatePromises = Object.entries(clinAssignments)
                .filter(([bliId, clinNumber]) => {
                    const existing = allBudgetLines.find((b) => b.id === Number(bliId))?.clin_id ?? null;
                    return clinNumber !== existing;
                })
                .map(([budgetLineId, clinNumber]) =>
                    updateBudgetLineItem({
                        id: parseInt(budgetLineId),
                        data: { clin_id: clinNumber }
                    }).unwrap()
                );

            if (clinUpdatePromises.length > 0) {
                await Promise.all(clinUpdatePromises);
            }

            // Update step 6 award fields (no approval_requested / approval_status change)
            await updateProcurementTrackerStep({
                stepId: step6.id,
                data: {
                    vendor_id: selectedVendor?.id ?? null,
                    contract_number: contractNumber.trim(),
                    award_amount: parseFloat(awardAmount),
                    award_date: formatDateForApi(awardDate),
                    requestor_notes: notes.trim() || null
                }
            }).unwrap();

            flushSync(() => {
                setIsNavigating(true);
            });

            const returnTo = searchParams.get("returnTo") || `/agreements/${agreementId}/review-award`;
            setAlert({
                type: "success",
                heading: "Award Information Updated",
                message: "The award information has been successfully updated.",
                redirectUrl: returnTo
            });
        } catch (error) {
            console.error("Failed to save award edits:", error);
            setSubmitError(error?.data?.message || "Failed to save changes. Please try again.");
            setIsSubmitting(false);
        }
    };

    /**
     * Handle cancel — navigate back without saving.
     */
    const handleCancel = () => {
        const returnTo = searchParams.get("returnTo") || `/agreements/${agreementId}/review-award`;
        if (hasChanged) {
            setShowModal(true);
            setModalProps({
                heading: "Are you sure you want to leave? Your changes will not be saved.",
                actionButtonText: "Leave without saving",
                secondaryButtonText: "Continue editing",
                handleConfirm: () => {
                    setShowModal(false);
                    setIsNavigating(true);
                    navigate(returnTo);
                },
                closeModal: () => {
                    setShowModal(false);
                }
            });
        } else {
            navigate(returnTo);
        }
    };

    return {
        agreement,
        isLoading,
        step6,
        notes,
        setNotes,
        handleSave,
        handleCancel,
        submitError,
        isSubmitting,
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
