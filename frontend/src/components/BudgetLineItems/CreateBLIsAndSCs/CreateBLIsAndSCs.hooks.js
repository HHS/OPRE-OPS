import cryptoRandomString from "crypto-random-string";
import React from "react";
import { useSelector } from "react-redux";
import { useBlocker, useNavigate } from "react-router-dom";
import {
    useAddAgreementMutation,
    useAddBudgetLineItemMutation,
    useAddGrantNumberMutation,
    useAddServicesComponentMutation,
    useDeleteAgreementMutation,
    useDeleteBudgetLineItemMutation,
    useDeleteGrantNumberMutation,
    useDeleteServicesComponentMutation,
    useGetVersionQuery,
    useUpdateBudgetLineItemMutation,
    useUpdateGrantNumberMutation,
    useUpdateServicesComponentMutation
} from "../../../api/opsAPI";
import {
    cleanAgreementForApi,
    cleanBudgetLineItemForApi,
    cleanBudgetLineItemsForApi,
    formatTeamMember,
    isNotDevelopedYet
} from "../../../helpers/agreement.helpers";
import {
    BLI_STATUS,
    BLILabel,
    budgetLinesTotal,
    getNonDRAFTBudgetLines,
    groupByGrantNumber,
    groupByServicesComponent
} from "../../../helpers/budgetLines.helpers";
import { AGREEMENT_TYPES } from "../../ServicesComponents/ServicesComponents.constants";
import { scrollToTop } from "../../../helpers/scrollToTop.helper";
import { formatDateForApi, formatDateForScreen, renderField } from "../../../helpers/utils";
import useAlert from "../../../hooks/use-alert.hooks";
import { useGetAllCans } from "../../../hooks/useGetAllCans";
import { useGetLoggedInUserFullName, useIsUserBudgetTeam } from "../../../hooks/user.hooks";
import {
    useEditAgreement,
    useEditAgreementDispatch
} from "../../Agreements/AgreementEditor/AgreementEditorContext.hooks";
import datePickerSuite from "../BudgetLinesForm/datePickerSuite";
import budgetFormSuite from "../BudgetLinesForm/suite";
import scFormSuite from "../../ServicesComponents/ServicesComponentForm/suite";
import suite from "./suite";

/**
 * Whether deleting this budget line routes through an approval change request instead of an
 * immediate hard delete. Mirrors the backend delete contract: DRAFT (or a super user) is hard-
 * deleted (HTTP 200); a non-super delete of a PLANNED/IN_EXECUTION line creates a deletion change
 * request (HTTP 202) and the line is left intact until approved. We infer this from the line's
 * status + the user's role (the same way the edit-via-change-request messaging is inferred), since
 * the delete mutation response does not surface the HTTP status code.
 *
 * Only PLANNED and IN_EXECUTION are approval-routed. Other statuses can't reach the delete control
 * here (deletability mirrors editability — EDITABLE_STATUSES is DRAFT/PLANNED/IN_EXECUTION — so
 * OBLIGATED, PLANNED_MOD, in-review, and OBE lines are not deletable in the wizard), so this returns
 * false for them, matching the DRAFT/super immediate-delete branch.
 * @param {import("../../../types/BudgetLineTypes").BudgetLine} budgetLine - The budget line being deleted.
 * @param {boolean} isSuperUser - Whether the acting user is a super user.
 * @returns {boolean} True if the deletion routes to an approval change request.
 */
export const isDeletionRoutedToApproval = (budgetLine, isSuperUser) => {
    if (isSuperUser) return false;
    return budgetLine?.status === BLI_STATUS.PLANNED || budgetLine?.status === BLI_STATUS.EXECUTING;
};

/**
 * Custom hook to manage the creation and manipulation of Budget Line Items and Service Components.
 *
 * @param {Function} setIsEditMode - Function to set the edit mode.
 * @param {boolean} isReviewMode - Flag to indicate if the component is in review mode.
 * @param {boolean} isEditMode - Flag to indicate if the component is in edit mode.
 * @param {import("../../../types/BudgetLineTypes").BudgetLine[]} budgetLines - Array of budget lines.
 * @param {Function} goToNext - Function to navigate to the next step.
 * @param {Function} goBack - Function to navigate to the previous step.
 * @param {Function} continueOverRide - Function to override the continue action.
 * @param {import("../../../types/AgreementTypes").Agreement} selectedAgreement - Selected agreement object.
 * @param {import("../../../types/AgreementTypes").ProcurementShop} selectedProcurementShop - Selected procurement shop object.
 * @param {"agreement" | "none"} workflow - The workflow type
 * @param {boolean} includeDrafts - Flag to include drafts budget lines.
 * @param {boolean} canUserEditBudgetLines - Flag to indicate if the user can edit budget lines.
 * @param {string} continueBtnText - The text to display on the "Continue" button.
 * @param {number} currentStep - The index of the current step in the wizard steps.
 *
 */
const useCreateBLIsAndSCs = (
    isEditMode,
    isReviewMode,
    budgetLines,
    goToNext,
    goBack,
    continueOverRide,
    selectedAgreement,
    selectedProcurementShop,
    setIsEditMode,
    workflow,
    includeDrafts,
    canUserEditBudgetLines,
    continueBtnText,
    currentStep
) => {
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({});
    const [showSaveChangesModal, setShowSaveChangesModal] = React.useState(false);
    const [servicesComponentNumber, setServicesComponentNumber] = React.useState(null);
    // Grant analog of servicesComponentNumber. Kept as a separate state pair so the two
    // linkage paths never cross-contaminate when the form switches type. See plan §9.
    const [grantNumberNumber, setGrantNumberNumber] = React.useState(null);
    const [selectedCan, setSelectedCan] = React.useState(null);
    const [enteredAmount, setEnteredAmount] = React.useState(null);
    const [needByDate, setNeedByDate] = React.useState(null);
    const [enteredDescription, setEnteredDescription] = React.useState(null);
    const [isEditing, setIsEditing] = React.useState(false);
    // Holds the `id` of the budget line currently being edited (not an array index —
    // tempBudgetLines/budgetLines can drift out of index-alignment after any add/delete/duplicate).
    const [budgetLineBeingEdited, setBudgetLineBeingEdited] = React.useState(null);
    const [groupedBudgetLinesByServicesComponent, setGroupedBudgetLinesByServicesComponent] = React.useState([]);
    const [groupedBudgetLinesByGrantNumber, setGroupedBudgetLinesByGrantNumber] = React.useState([]);
    const [isBudgetLineNotDraft, setIsBudgetLineNotDraft] = React.useState(false);
    const navigate = useNavigate();
    const { setAlert } = useAlert();
    const [addAgreement] = useAddAgreementMutation();
    const [deleteAgreement] = useDeleteAgreementMutation();
    const [updateBudgetLineItem] = useUpdateBudgetLineItemMutation();
    const [addBudgetLineItem] = useAddBudgetLineItemMutation();
    const [deleteBudgetLineItem] = useDeleteBudgetLineItemMutation();
    const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
    const [blockerDisabledForCreateAgreement, setBlockerDisabledForCreateAgreement] = React.useState(false);
    const [deleteServicesComponent] = useDeleteServicesComponentMutation();
    const [addServicesComponent] = useAddServicesComponentMutation();
    const [updateServicesComponent] = useUpdateServicesComponentMutation();
    const [addGrantNumber] = useAddGrantNumberMutation();
    const [updateGrantNumber] = useUpdateGrantNumberMutation();
    const [deleteGrantNumber] = useDeleteGrantNumberMutation();
    const loggedInUserFullName = useGetLoggedInUserFullName();
    const { cans } = useGetAllCans();
    const isAgreementNotYetDeveloped = isNotDevelopedYet(selectedAgreement.agreement_type);
    const isGrant = selectedAgreement.agreement_type === AGREEMENT_TYPES.GRANT;
    const {
        agreement,
        services_components: servicesComponents,
        deleted_services_components_ids: deletedServicesComponentsIds,
        grant_numbers: grantNumbers,
        deleted_grant_numbers_ids: deletedGrantNumbersIds,
        budget_line_items: tempBudgetLines,
        deleted_budget_line_items_ids: deletedBudgetLines
    } = useEditAgreement();
    const dispatch = useEditAgreementDispatch();

    const activeUser = useSelector((state) => state.auth.activeUser);
    const isSuperUser = activeUser?.is_superuser ?? false;
    const isBudgetTeam = useIsUserBudgetTeam();

    // Per-environment capability: when ON, in-Planned budget-detail edits apply immediately
    // (no Change Request), matching the backend's SKIP_CR_FOR_DRAFT_PLANNED behavior. Default
    // to false until the version query resolves so the approval UX never gets suppressed
    // prematurely. The backend is the enforcement authority; this only drives display/copy.
    const { data: versionData } = useGetVersionQuery();
    const skipCrForDraftPlanned = versionData?.skip_cr_for_draft_planned ?? false;

    // Budget Team members and superusers write financial changes directly (no change-request
    // workflow), matching the backend's is_budget_team()/is_super_user() bypasses.
    const bypassEditDirectly = isSuperUser || isBudgetTeam;
    // When the capability is ON, in-Planned budget-detail edits also apply immediately for any
    // user — but ONLY when every financially-changed editable line is PLANNED (the flag's
    // scope). If any changed line is IN_EXECUTION it still needs approval, so we keep the
    // approval UX for the whole save (mixed-case copy is a deferred product decision).
    const changedFinancialBLIs = tempBudgetLines.filter((bli) => !bli.in_review && bli.financialSnapshotChanged);
    const flagAllowsDirectApply =
        skipCrForDraftPlanned &&
        changedFinancialBLIs.length > 0 &&
        changedFinancialBLIs.every((bli) => bli.status === BLI_STATUS.PLANNED);
    const canEditDirectly = bypassEditDirectly || flagAllowsDirectApply;

    // Snapshot the page-suite result in state. The suites are module-level singletons
    // read during render (here and in BudgetLinesForm), so a stale result from a prior
    // session/agreement can be painted before the reset effect below fires. Storing the
    // result in state lets the effect call setState after reset(), which schedules a
    // re-render with clean validation instead of relying on an incidental re-render. (issue #5894)
    const [pageSuiteResult, setPageSuiteResult] = React.useState(() => suite.get());

    // Reset validation suites on mount and unmount so stale results from a
    // previous agreement or user session never paint errors on a fresh form. (issue #5894)
    React.useEffect(() => {
        suite.reset();
        budgetFormSuite.reset();
        datePickerSuite.reset();
        scFormSuite.reset();
        // Force a re-render with the freshly-cleared state so the render-time reads
        // (this hook's `res` and BudgetLinesForm's datePickerSuite.get()) repaint clean.
        setPageSuiteResult(suite.get());
        return () => {
            suite.reset();
            budgetFormSuite.reset();
            datePickerSuite.reset();
            scFormSuite.reset();
        };
    }, []);

    // Derive the effective SC window from all services components (saved and unsaved).
    // All SCs (saved or unsaved) carry period_start/period_end in YYYY-MM-DD format.
    // Unsaved SCs also have popStartDate/popEndDate (MM/DD/YYYY) from the form, but
    // period_start/period_end is always populated by the time the SC is dispatched.
    const effectiveScStartDate = React.useMemo(() => {
        const dates = servicesComponents.map((sc) => sc.period_start).filter(Boolean);
        return dates.length > 0 ? dates.reduce((min, d) => (d < min ? d : min)) : null;
    }, [servicesComponents]);

    const effectiveScEndDate = React.useMemo(() => {
        const dates = servicesComponents.map((sc) => sc.period_end).filter(Boolean);
        return dates.length > 0 ? dates.reduce((max, d) => (d > max ? d : max)) : null;
    }, [servicesComponents]);

    // Disable this blocker once the wizard advances past step 0. The review-screen
    // caller (EditAgreementAndBudgetLines) never passes currentStep, so it stays 0 and
    // this blocker remains disabled there — the review screen owns its own blocker via
    // useNavigationBlocker. Do NOT pass currentStep from the review screen: that would
    // activate a second live blocker and both would fire on the same navigation.
    React.useEffect(() => {
        if (currentStep != 0) {
            setBlockerDisabledForCreateAgreement(true);
        }
    }, [currentStep]);

    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            !blockerDisabledForCreateAgreement &&
            hasUnsavedChanges &&
            currentLocation.pathname !== nextLocation.pathname
    );

    // Attach each BLI's current services-component PoP window (sc_period_start/sc_period_end)
    // for the "Obligate By must fall within PoP" validation (row error + tooltip in BLIRow, and
    // the suite rule that gates Save). Derived live from the current servicesComponents rather
    // than baked into editor state, so it stays correct when the user edits an SC's PoP dates,
    // deletes an SC, or reassigns a BLI to a different SC in the same session. Grant BLIs have no
    // SC, so they get null and the PoP rule skips them.
    const budgetLinesWithScPeriod = React.useMemo(() => {
        return tempBudgetLines.map((bli) => {
            const sc = servicesComponents.find((sc) => sc.id === bli.services_component_id);
            return {
                ...bli,
                sc_period_start: sc?.period_start ?? null,
                sc_period_end: sc?.period_end ?? null
            };
        });
    }, [tempBudgetLines, servicesComponents]);

    React.useEffect(() => {
        setGroupedBudgetLinesByServicesComponent(groupByServicesComponent(budgetLinesWithScPeriod));
    }, [budgetLinesWithScPeriod]);

    React.useEffect(() => {
        // Don't pass grantNumbers here — that would pre-populate an empty-budgetLines
        // group for every grant number added, hiding the "no budget lines yet" message
        // the moment a grant number exists, before any budget line is added. Mirrors the
        // services-component grouping call above, which has the same omission for the
        // same reason.
        setGroupedBudgetLinesByGrantNumber(groupByGrantNumber(tempBudgetLines));
    }, [tempBudgetLines]);

    // Validation
    // Review mode re-runs the suite every render against the current budget lines.
    // Non-review mode reads the state-backed snapshot so a mount-time reset() repaints
    // clean instead of surfacing a stale singleton result. (issue #5894)
    const res = isReviewMode
        ? suite.run({
              // Exclude in-review BLIs from validation — they are locked (not editable) and
              // won't be included in the save payload, so their TBD fields should not block saving.
              // Use the SC-period-enriched lines so the Obligate-By-within-PoP rule can evaluate.
              budgetLines: budgetLinesWithScPeriod.filter((bli) => !bli.in_review)
          })
        : pageSuiteResult;
    const pageErrors = res.getErrors();
    // Filter page errors to only include "Budget line item" errors and consolidate into single message
    const budgetLineErrors = Object.entries(pageErrors).filter((error) => error[0].includes("Budget line item"));

    const budgetLinePageErrors = budgetLineErrors.length > 0 ? [["This is required information"]] : [];
    const budgetLinePageErrorsExist = budgetLinePageErrors.length > 0;
    // card data
    const notDraftBLIs = getNonDRAFTBudgetLines(tempBudgetLines);
    const nonDraftBudgetLines = notDraftBLIs;
    const budgetLinesForCards = includeDrafts ? tempBudgetLines : notDraftBLIs;
    /**
     * Get the total fees for the cards
     * @param {import("../../../types/BudgetLineTypes").BudgetLine[]} budgetLines - The budget lines
     * @returns {number} - The total fees
     */
    const feesForCards = (budgetLines) =>
        budgetLines.reduce((totalFees, budgetLine) => totalFees + (budgetLine.fees || 0), 0);

    /**
     * Get the sub total for the cards
     * @param {import("../../../types/BudgetLineTypes").BudgetLine[]} budgetLines - The budget lines
     * @returns {number} - The sub total
     * */
    const subTotalForCards = (budgetLines) => budgetLinesTotal(budgetLines);
    /**
     * Get the totals for the cards
     * @param {number} subTotal - The sub total
     * @param {import("../../../types/BudgetLineTypes").BudgetLine[]} budgetLines - The budget lines
     * @returns {number} - The total
     * */
    const totalsForCards = (subTotal, budgetLines) => subTotal + feesForCards(budgetLines);

    /**
     * NOTE: 1st useCallback in this file
     * Handle cleaning up BLIs and updating to the API
     * @param {import("../../../types/BudgetLineTypes").BudgetLine[]} existingBudgetLineItems - The existing budget line items
     * @returns {Promise<any>[]} - The promise
     */
    const handleUpdateBLIsToAPI = React.useCallback(
        (existingBudgetLineItems) => {
            const promises = existingBudgetLineItems.map(async (existingBudgetLineItem) => {
                const { id, data: cleanExistingBLI } = cleanBudgetLineItemForApi(existingBudgetLineItem);

                const unchangedBudgetLineItem = budgetLines.find((bli) => bli.id === existingBudgetLineItem.id);
                let budgetLineHasChanged =
                    JSON.stringify(existingBudgetLineItem) !== JSON.stringify(unchangedBudgetLineItem); // We have to check every single property to see if there's ANY change
                if (budgetLineHasChanged) {
                    return updateBudgetLineItem({ id, data: cleanExistingBLI }).unwrap();
                }
            });
            return promises;
        },
        [budgetLines, updateBudgetLineItem]
    );

    /**
     * NOTE: 2nd useCallback in this file
     * Handle deletions of budget lines and service components
     * @returns {Promise<void>} - The promise
     */
    const handleDeletions = React.useCallback(async () => {
        try {
            const serviceComponentDeletionPromises = deletedServicesComponentsIds.map((id) =>
                deleteServicesComponent(id).unwrap()
            );
            const grantNumberDeletionPromises = (deletedGrantNumbersIds ?? []).map((id) =>
                deleteGrantNumber(id).unwrap()
            );
            const blisDeletionPromises = deletedBudgetLines.map((id) => deleteBudgetLineItem(id).unwrap());

            // BLIs first so a grant number / SC with a SET NULL FK isn't deleted out from under a BLI still referencing it.
            await Promise.all(blisDeletionPromises);
            await Promise.all(serviceComponentDeletionPromises);
            await Promise.all(grantNumberDeletionPromises);
        } catch (error) {
            console.error("Error deleting budget lines:", error);
            setAlert({
                type: "error",
                heading: "Error",
                message: "An error occurred while deleting budget lines. Please try again."
            });
        }
    }, [
        deletedServicesComponentsIds,
        deletedGrantNumbersIds,
        deletedBudgetLines,
        deleteServicesComponent,
        deleteGrantNumber,
        deleteBudgetLineItem,
        setAlert
    ]);

    /**
     * NOTE: 3rd useCallback in this file
     * function to create a message for the alert
     * @param {import("../../../types/BudgetLineTypes").BudgetLine[]} tempBudgetLines - The temporary budget lines
     * @returns {string} - The message(s) to display in the Alert in bullet points
     */
    const createBudgetChangeMessages = React.useCallback(
        (tempBudgetLines) => {
            const budgetChangeMessages = new Set();
            const fieldsToCheck = ["date_needed", "can_id", "amount"];

            tempBudgetLines.forEach((tempBudgetLine) => {
                const bliId = `\u2022 BL ${tempBudgetLine?.id || "Unknown"}`;
                const { financialSnapshot, tempChangeRequest } = tempBudgetLine;

                fieldsToCheck.forEach((field) => {
                    if (tempChangeRequest && tempChangeRequest[field] !== undefined) {
                        let oldValue, newValue;

                        switch (field) {
                            case "amount":
                                oldValue = renderField(
                                    "ContractBudgetLineItem",
                                    "amount",
                                    financialSnapshot.originalAmount
                                );
                                newValue = renderField("ContractBudgetLineItem", "amount", tempChangeRequest.amount);
                                budgetChangeMessages.add(`${bliId} Amount: ${oldValue} to ${newValue}`);
                                break;
                            case "date_needed":
                                oldValue = renderField(
                                    "ContractBudgetLineItem",
                                    "date_needed",
                                    financialSnapshot.originalDateNeeded
                                );
                                newValue = renderField(
                                    "ContractBudgetLineItem",
                                    "date_needed",
                                    tempChangeRequest.date_needed
                                );
                                budgetChangeMessages.add(`${bliId} Obligate By Date: ${oldValue} to ${newValue}`);
                                break;
                            case "can_id":
                                oldValue =
                                    cans?.find((can) => can.id === financialSnapshot.originalCanID)?.display_name ||
                                    "Unknown";
                                newValue =
                                    cans?.find((can) => can.id === tempChangeRequest.can_id)?.display_name || "Unknown";
                                budgetChangeMessages.add(`${bliId} CAN: ${oldValue} to ${newValue}`);
                                break;
                        }
                    }
                });
            });

            return Array.from(budgetChangeMessages).join("\n");
        },
        [cans]
    );

    /**
     * NOTE: 4th useCallback in this file
     * Handle saving the budget lines without financial snapshot changes
     * @param {import("../../../types/BudgetLineTypes").BudgetLine[]} existingBudgetLineItems - The existing budget line items
     * @returns {Promise<void>} - The promise
     */
    const handleRegularUpdates = React.useCallback(
        async (existingBudgetLineItems) => {
            try {
                const updatePromises = handleUpdateBLIsToAPI(existingBudgetLineItems);

                const results = await Promise.all(updatePromises);
                console.log(`${results.filter(Boolean).length} budget lines updated successfully`);
            } catch (error) {
                console.error("Error updating budget lines:", error);
                setAlert({
                    type: "error",
                    heading: "Error",
                    message: "An error occurred while updating budget lines. Please try again."
                });
                throw error; // Re-throw the error to be caught in handleSave
            }
        },
        [handleUpdateBLIsToAPI, setAlert]
    );

    const resetForm = React.useCallback(() => {
        setIsEditing(false);
        setServicesComponentNumber(null);
        setGrantNumberNumber(null);
        setSelectedCan(null);
        setEnteredAmount(null);
        setNeedByDate(null);
        setEnteredDescription(null);
        setBudgetLineBeingEdited(null);
        suite.reset();
        budgetFormSuite.reset();
        datePickerSuite.reset();
    }, []);
    /**
     * NOTE: 5th useCallback in this file
     * Handle saving the budget lines with financial snapshot changes via the blocker
     * @param {import("../../../types/BudgetLineTypes").BudgetLine[]} existingBudgetLineItems - The existing budget line items
     * @returns {Promise<void>} - The promise
     */
    const handleFinancialSnapshotChangesViaBlocker = React.useCallback(
        async (existingBudgetLineItems) => {
            try {
                const updatePromises = handleUpdateBLIsToAPI(existingBudgetLineItems);
                const results = await Promise.allSettled(updatePromises);

                resetForm();

                const rejected = results.filter((result) => result.status === "rejected");
                if (rejected.length > 0) {
                    console.error(rejected[0].reason);
                    setAlert({
                        type: "error",
                        heading: "Error Sending Agreement Edits",
                        message: "There was an error sending your edits for approval. Please try again.",
                        redirectUrl: "/error"
                    });
                    throw new Error("Error sending agreement edits");
                } else {
                    setAlert({
                        type: "success",
                        heading: "Changes Sent to Approval",
                        message:
                            "Your changes have been successfully sent to your Division Director to review. Once approved, they will update on the agreement.",
                        redirectUrl: blocker.nextLocation?.pathname
                    });
                }
            } catch (error) {
                console.error("Error updating budget lines:", error);
                setAlert({
                    type: "error",
                    heading: "Error",
                    message: "An error occurred while updating budget lines. Please try again.",
                    redirectUrl: "/error"
                });
                throw error;
            } finally {
                setIsEditMode(false);
                scrollToTop();
            }
        },
        [handleUpdateBLIsToAPI, resetForm, setAlert, setIsEditMode, blocker]
    );

    /**
     * NOTE: 6th useCallback in this file
     * Handle saving the budget lines with financial snapshot changes
     * @param {import("../../../types/BudgetLineTypes").BudgetLine[]} existingBudgetLineItems - The existing budget line items
     * @returns {Promise<void>} - The promise
     */
    const handleFinancialSnapshotChanges = React.useCallback(
        async (existingBudgetLineItems) => {
            return new Promise((resolve, reject) => {
                setShowModal(true);
                setModalProps({
                    heading:
                        "Budget changes require approval from your Division Director. Do you want to send it to approval?",
                    actionButtonText: "Send to Approval",
                    secondaryButtonText: "Continue Editing",
                    handleConfirm: async () => {
                        try {
                            const updatePromises = handleUpdateBLIsToAPI(existingBudgetLineItems);

                            const results = await Promise.allSettled(updatePromises);

                            resetForm();

                            const rejected = results.filter((result) => result.status === "rejected");
                            if (rejected.length > 0) {
                                console.error(rejected[0].reason);
                                setAlert({
                                    type: "error",
                                    heading: "Error Sending Agreement Edits",
                                    message: "There was an error sending your edits for approval. Please try again.",
                                    redirectUrl: "/error"
                                });
                                reject(new Error("Error sending agreement edits"));
                            } else {
                                setAlert({
                                    type: "success",
                                    heading: "Changes Sent to Approval",
                                    message:
                                        "Your changes have been successfully sent to your Division Director to review. Once approved, they will update on the agreement.",
                                    redirectUrl: `/agreements/${selectedAgreement?.id}`
                                });
                                resolve();
                            }
                        } catch (error) {
                            console.error("Error updating budget lines:", error);
                            setAlert({
                                type: "error",
                                heading: "Error",
                                message: "An error occurred while updating budget lines. Please try again.",
                                redirectUrl: "/error"
                            });
                            reject(error);
                        } finally {
                            setIsEditMode(false);
                            scrollToTop();
                        }
                    },
                    handleSecondary: () => {
                        resolve(); // Resolve without making changes if user chooses to continue editing
                    }
                });
            });
        },
        [handleUpdateBLIsToAPI, resetForm, setAlert, selectedAgreement?.id, setIsEditMode, setShowModal, setModalProps]
    );

    /**
     * NOTE: 7th useCallback in this file
     * Show the success message
     * @param {boolean} isThereAnyBLIsFinancialSnapshotChanged - Flag to indicate if there are financial snapshot changes
     * @returns {void}
     */
    const showSuccessMessage = React.useCallback(
        (isThereAnyBLIsFinancialSnapshotChanged, savedViaModal) => {
            const budgetChangeMessages = createBudgetChangeMessages(tempBudgetLines);
            // Deletions of PLANNED/IN_EXECUTION lines route to an approval change request rather than
            // deleting immediately, so a save containing any of them was "sent to approval" too — even
            // when there were no financial-snapshot edits. Deleted lines are already out of
            // tempBudgetLines, so this signal is derived from deletedBudgetLines separately.
            // Financial edits write directly for super users AND budget team (canEditDirectly);
            // only other users route them to approval. Deletions are different: the backend hard-
            // deletes only for super users / DRAFT, so a budget-team delete of a PLANNED/IN_EXECUTION
            // line STILL routes to a change request — hence the deletion signal gates on super-user
            // only (via isDeletionRoutedToApproval), not canEditDirectly.
            // deletedBudgetLines holds bare ids. Look each up in the original budgetLines prop
            // to get the authoritative status isDeletionRoutedToApproval needs.
            const deletionsRoutedToApproval = deletedBudgetLines
                .map((id) => budgetLines.find((bl) => bl.id === id))
                .filter((bl) => isDeletionRoutedToApproval(bl, isSuperUser));
            const deletionChangeMessages = deletionsRoutedToApproval
                .map((bl) => `• BL ${bl?.id || "Unknown"} Deletion`)
                .join("\n");
            const anyChangeSentToApproval =
                (isThereAnyBLIsFinancialSnapshotChanged && !canEditDirectly) || deletionsRoutedToApproval.length > 0;
            const pendingChanges = [budgetChangeMessages, deletionChangeMessages].filter(Boolean).join("\n");
            if (continueOverRide) {
                continueOverRide();
            } else if (anyChangeSentToApproval) {
                setAlert({
                    type: "success",
                    heading: "Changes Sent to Approval",
                    message:
                        `Your changes have been successfully sent to your Division Director to review. Once approved, they will update on the agreement.\n\n` +
                        `<strong>Pending Changes:</strong>\n` +
                        ` ${pendingChanges}`,
                    redirectUrl: savedViaModal ? blocker.nextLocation : `/agreements/${selectedAgreement?.id}`
                });
            } else {
                setAlert({
                    type: "success",
                    heading: "Agreement Updated",
                    message: `The agreement ${selectedAgreement?.display_name} has been successfully updated.`,
                    redirectUrl: savedViaModal ? blocker.nextLocation : `/agreements/${selectedAgreement?.id}`
                });
            }
        },
        [
            tempBudgetLines,
            deletedBudgetLines,
            budgetLines,
            continueOverRide,
            canEditDirectly,
            isSuperUser,
            setAlert,
            selectedAgreement?.id,
            selectedAgreement?.display_name,
            createBudgetChangeMessages,
            blocker.nextLocation
        ]
    );
    /**
     * Handle adding a budget line
     * @param {Event} e - The event object
     * @returns {void}
     */
    const handleAddBLI = (e) => {
        e.preventDefault();

        const newBudgetLine = {
            id: cryptoRandomString({ length: 10 }),
            services_component_number: servicesComponentNumber,
            grant_number_number: grantNumberNumber,
            line_description: enteredDescription || "",
            can_id: selectedCan?.id || null,
            can: selectedCan || null,
            canDisplayName: selectedCan?.display_name || null,
            agreement_id: selectedAgreement?.id || null,
            agreement: {
                procurement_shop: {
                    ...selectedProcurementShop,
                    current_fee: { fee: selectedProcurementShop?.fee_percentage ?? 0 }
                }
            },
            amount: enteredAmount || 0,
            status: BLI_STATUS.DRAFT,
            date_needed: formatDateForApi(needByDate),
            proc_shop_fee_percentage: selectedProcurementShop?.fee_percentage || null,
            fees: (enteredAmount ?? 0) * ((selectedProcurementShop?.fee_percentage ?? 0) / 100),
            _meta: { isEditable: true }
        };
        dispatch({ type: "ADD_BUDGET_LINE_ITEM", payload: newBudgetLine });
        setHasUnsavedChanges(true);
        setAlert({
            type: "success",
            message: `Budget line ${BLILabel(newBudgetLine)} was updated. When you're done editing, click ${continueBtnText} below.`,
            isCloseable: false,
            isToastMessage: true
        });
        resetForm();
    };
    /**
     * Handle editing a budget line
     * @param {Event} e - The event object
     * @returns {void}
     */
    const handleEditBLI = (e) => {
        e.preventDefault();

        if (!tempBudgetLines || !Array.isArray(tempBudgetLines)) {
            console.error("tempBudgetLines is not defined or not an array");
            return;
        }

        const currentBudgetLine = tempBudgetLines.find((bl) => bl.id === budgetLineBeingEdited);

        if (budgetLineBeingEdited == null || !currentBudgetLine) {
            console.error("Invalid budgetLineBeingEdited id");
            return;
        }

        // Match by id (not array position) — tempBudgetLines and the original budgetLines
        // prop can drift out of index-alignment after any add/delete/duplicate, so an
        // index-based lookup here could compare against the wrong BLI's original values.
        const originalBudgetLine = budgetLines.find((bl) => bl.id === budgetLineBeingEdited);

        // Initialize financialSnapshot
        const financialSnapshot = {
            originalAmount: originalBudgetLine?.amount,
            originalDateNeeded: originalBudgetLine?.date_needed,
            originalCanID: originalBudgetLine?.can_id,
            enteredAmount: enteredAmount,
            needByDate: needByDate,
            selectedCanId: selectedCan?.id
        };

        // Initialize tempChangeRequest
        let tempChangeRequest = currentBudgetLine.tempChangeRequest || {};

        // Compare with the original values in financialSnapshot
        if (enteredAmount !== financialSnapshot.originalAmount) {
            tempChangeRequest.amount = enteredAmount;
        } else {
            delete tempChangeRequest.amount;
        }

        if (formatDateForApi(needByDate) !== financialSnapshot.originalDateNeeded) {
            tempChangeRequest.date_needed = formatDateForApi(needByDate);
        } else {
            delete tempChangeRequest.date_needed;
        }

        if (selectedCan?.id !== financialSnapshot.originalCanID) {
            tempChangeRequest.can_id = selectedCan?.id;
        } else {
            delete tempChangeRequest.can_id;
        }

        const financialSnapshotChanged = Object.keys(tempChangeRequest).length > 0;
        const BLIStatusIsPlannedOrExecuting =
            currentBudgetLine.status === BLI_STATUS.PLANNED || currentBudgetLine.status === BLI_STATUS.EXECUTING;

        // The SC dropdown only offers non-sub-component SCs, so an actual change here can only
        // ever land on a bare number. When the number is unchanged, preserve the original
        // grouping label as-is — it may carry a sub-component suffix (e.g. "2-A") that a bare
        // number would not match in addServiceComponentIdToBLI, silently dropping the BLI's SC
        // link on save.
        const serviceComponentGroupingLabel =
            servicesComponentNumber === currentBudgetLine.services_component_number
                ? currentBudgetLine.serviceComponentGroupingLabel
                : (servicesComponentNumber ?? 0).toString();

        // Keep grant_number_id in sync with the dropdown selection. Spreading currentBudgetLine
        // alone would retain the BLI's original (stale) grant_number_id, and both save paths key
        // off it: the non-bundle path's addGrantNumberIdToBLI resolves by id (ignoring the new
        // selection), and the bundle dirty-check compares grant_number_id (treating a
        // reassignment as no change). For an existing (persisted) grant number we stamp its id
        // now; for a not-yet-persisted in-session grant number there is no id yet, so null it and
        // let the save-time number/ref resolution link it.
        const selectedGrantNumber = grantNumbers?.find((gn) => gn.number === grantNumberNumber);
        const reassignedGrantNumberId =
            selectedGrantNumber && "created_on" in selectedGrantNumber ? selectedGrantNumber.id : null;

        const payload = {
            ...currentBudgetLine,
            // For grants, stamp the grant number key; do NOT re-stamp the SC fields (they would
            // rewrite the BLI as "SC 0" and break grouping). For contracts, keep the SC fields.
            ...(isGrant
                ? { grant_number_number: grantNumberNumber, grant_number_id: reassignedGrantNumberId }
                : {
                      services_component_number: servicesComponentNumber,
                      serviceComponentGroupingLabel
                  }),
            line_description: enteredDescription || "",
            can_id: selectedCan?.id || null,
            can: selectedCan || null,
            canDisplayName: selectedCan?.display_name || null,
            agreement_id: selectedAgreement?.id || null,
            agreement: {
                ...currentBudgetLine.agreement,
                procurement_shop: {
                    ...selectedProcurementShop,
                    current_fee: { fee: selectedProcurementShop?.fee_percentage ?? 0 }
                }
            },
            amount: enteredAmount || 0,
            status: currentBudgetLine.status || BLI_STATUS.DRAFT,
            date_needed: formatDateForApi(needByDate),
            proc_shop_fee_percentage: selectedProcurementShop?.fee_percentage || null,
            financialSnapshot: {
                ...financialSnapshot,
                enteredAmount: enteredAmount,
                needByDate: formatDateForApi(needByDate),
                selectedCanId: selectedCan?.id
            },
            fees: ((enteredAmount ?? 0) * (selectedProcurementShop?.fee_percentage ?? 0)) / 100
        };

        if (financialSnapshotChanged && BLIStatusIsPlannedOrExecuting) {
            payload.financialSnapshotChanged = true;
            payload.tempChangeRequest = tempChangeRequest;
        } else {
            delete payload.financialSnapshotChanged;
            delete payload.tempChangeRequest;
        }
        dispatch({ type: "UPDATE_BUDGET_LINE_ITEM", payload });
        setHasUnsavedChanges(true);

        setAlert({
            type: "success",
            message: `Budget line ${BLILabel(currentBudgetLine)} was updated.  When you’re done editing, click Save & Exit below.`,
            isCloseable: false,
            isToastMessage: true
        });
        resetForm();
    };
    /**
     * Handle deleting a budget line
     * @param {number} budgetLineId - The ID of the budget line to delete
     * @returns {void}
     */
    const handleDeleteBudgetLine = (budgetLineId) => {
        const budgetLine = tempBudgetLines.find((bl) => bl.id === budgetLineId);
        setShowModal(true);
        setModalProps({
            heading: `Are you sure you want to delete budget line ${BLILabel(budgetLine)}?`,
            actionButtonText: "Delete",
            handleConfirm: () => {
                dispatch({ type: "DELETE_BUDGET_LINE_ITEM", payload: budgetLine });
                setHasUnsavedChanges(true);
                // A PLANNED/IN_EXECUTION delete routes to an approval change request on save rather
                // than being deleted outright, so don't claim it was deleted.
                const message = isDeletionRoutedToApproval(budgetLine, isSuperUser)
                    ? `The deletion of budget line ${BLILabel(budgetLine)} has been queued and will be sent to your Division Director for approval when you save.`
                    : `The budget line ${BLILabel(budgetLine)} has been successfully deleted.`;
                setAlert({
                    type: "success",
                    message,
                    isCloseable: false,
                    isToastMessage: true
                });
                resetForm();
            }
        });
    };

    /**
     *
     * @param {import("../../../types/BudgetLineTypes").BudgetLine} budgetLineItem
     * @param {Array<import("../../../types/ServicesComponents").ServicesComponents>} createdServiceComponents
     */
    const addServiceComponentIdToBLI = (budgetLineItem, createdServiceComponents) => {
        let matchServiceComponent;
        // for new BLIs without a grouping label, match only on number
        if (!budgetLineItem.serviceComponentGroupingLabel) {
            matchServiceComponent = createdServiceComponents
                .filter((serviceComponent) => !serviceComponent.sub_component)
                .find((sC) => sC.number === budgetLineItem.services_component_number);
        } else {
            // for existing BLIs with a grouping label, match on full grouping label
            matchServiceComponent = createdServiceComponents.find((sc) => {
                const scGroupingLabel = sc.sub_component ? `${sc.number}-${sc.sub_component}` : `${sc.number}`;
                return scGroupingLabel === budgetLineItem.serviceComponentGroupingLabel;
            });
        }

        return {
            ...budgetLineItem,
            services_component_id: matchServiceComponent?.id ?? null,
            services_component_number: undefined, // Remove this property immutably
            serviceComponentGroupingLabel: undefined // Remove this property immutably
        };
    };

    /**
     * Grant analog of addServiceComponentIdToBLI. Resolves grant_number_id by matching the
     * editor-state grant_number_number against the (possibly just-created) grant numbers and
     * strips the UI-only key. See plan §9/§11.
     * @param {import("../../../types/BudgetLineTypes").BudgetLine} budgetLineItem
     * @param {Array<import("../../../types/GrantNumbers").GrantNumber>} createdGrantNumbers
     */
    const addGrantNumberIdToBLI = (budgetLineItem, createdGrantNumbers) => {
        // For persisted BLIs (have a grant_number_id), prefer ID-based matching so a renamed
        // grant number (same id, changed number) is not incorrectly disassociated on save.
        if (budgetLineItem.grant_number_id != null) {
            const byId = createdGrantNumbers.find((gn) => gn.id === budgetLineItem.grant_number_id);
            return {
                ...budgetLineItem,
                grant_number_id: byId?.id ?? null,
                grant_number_number: undefined
            };
        }
        // New BLIs have no ID yet — fall back to number matching.
        // When a grant number is deleted mid-edit its referencing BLIs retain their
        // grant_number_number but the number no longer resolves. Mirror the SC path
        // (addServiceComponentIdToBLI) and null the link so the BLI is disassociated
        // rather than causing an error.
        const matchGrantNumber = createdGrantNumbers.find((gn) => gn.number === budgetLineItem.grant_number_number);
        return {
            ...budgetLineItem,
            grant_number_id: matchGrantNumber?.id ?? null,
            grant_number_number: undefined
        };
    };

    /**
     * Set the budget line for editing by its ID
     * @param {number} budgetLineId - The ID of the budget line to edit
     * @returns {void}
     */
    const handleSetBudgetLineForEditingById = (budgetLineId) => {
        resetForm();
        const index = tempBudgetLines.findIndex((budgetLine) => budgetLine.id === budgetLineId);
        if (index !== -1) {
            const {
                services_component_number: serviceComponentNumber,
                grant_number_number: grantNumberNumberForEdit,
                line_description,
                can,
                amount,
                date_needed
            } = tempBudgetLines[index];
            const dateForScreen = formatDateForScreen(date_needed);
            setBudgetLineBeingEdited(budgetLineId);
            setServicesComponentNumber(serviceComponentNumber);
            setGrantNumberNumber(grantNumberNumberForEdit);
            setSelectedCan(can);
            setEnteredAmount(amount);
            setNeedByDate(dateForScreen);
            setEnteredDescription(line_description);
            setIsEditing(true);
            setIsBudgetLineNotDraft(tempBudgetLines[index].status !== BLI_STATUS.DRAFT);
        }
    };
    /**
     * Handle duplicating a budget line
     * @param {number} budgetLineId - The ID of the budget line to duplicate
     * @returns {void}
     */
    const handleDuplicateBudgetLine = (budgetLineId) => {
        const budgetLine = tempBudgetLines.find((bl) => bl.id === budgetLineId);
        if (!budgetLine) {
            return;
        }
        const {
            services_component_id,
            services_component_number,
            grant_number_id,
            grant_number_number,
            line_description,
            can_id,
            can,
            agreement_id,
            amount,
            date_needed,
            proc_shop_fee_percentage
        } = budgetLine;
        const payload = {
            id: cryptoRandomString({ length: 10 }),
            services_component_id,
            services_component_number,
            grant_number_id,
            grant_number_number,
            line_description,
            can_id,
            can,
            canDisplayName: can?.display_name || null,
            agreement_id,
            agreement: budgetLine.agreement,
            amount,
            date_needed,
            proc_shop_fee_percentage,
            status: BLI_STATUS.DRAFT,
            created_by: loggedInUserFullName,
            // Mirror handleAddBLI: a duplicated draft BLI must be editable so its
            // edit/delete/duplicate icons stay enabled. Without this the row reads
            // _meta?.isEditable as undefined and renders the disabled icons. (issue #6020)
            _meta: { isEditable: true }
        };
        dispatch({ type: "ADD_BUDGET_LINE_ITEM", payload });
        resetForm();
    };

    const handleCancel = () => {
        const isCreatingNewAgreement = !isEditMode && !isReviewMode && canUserEditBudgetLines;
        const heading = isCreatingNewAgreement
            ? "Are you sure you want to cancel creating a new agreement? Your progress will not be saved."
            : "Are you sure you want to cancel editing? Your changes will not be saved.";

        const actionButtonText = isCreatingNewAgreement ? "Cancel Agreement" : "Cancel Edits";

        setShowModal(true);
        setModalProps({
            heading,
            actionButtonText,
            secondaryButtonText: "Continue Editing",
            handleConfirm: () => {
                if (isCreatingNewAgreement) {
                    // Only allow deleting the agreement if creating a new one
                    deleteAgreement(selectedAgreement?.id)
                        .unwrap()
                        .then((fulfilled) => {
                            console.log(`DELETE agreement success: ${JSON.stringify(fulfilled, null, 2)}`);
                            setAlert({
                                type: "success",
                                heading: "Create New Agreement Cancelled",
                                message: "Your agreement has been cancelled.",
                                redirectUrl: "/agreements"
                            });
                        })
                        .catch((rejected) => {
                            console.error(`DELETE agreement rejected: ${JSON.stringify(rejected, null, 2)}`);
                            setAlert({
                                type: "error",
                                heading: "Error",
                                message: "An error occurred while deleting the agreement.",
                                redirectUrl: "/error"
                            });
                        })
                        .finally(() => {
                            resetForm();
                        });
                } else {
                    // For editing existing agreements or when user can't edit
                    resetForm();
                    dispatch({ type: "RESEED_BUDGET_LINE_ITEMS", payload: [] });
                    setIsEditMode(false);
                    navigate(`/agreements/${selectedAgreement?.id}/budget-lines`);
                    scrollToTop();
                }
            }
        });
    };

    const handleGoBack = () => {
        if (workflow === "none") {
            setIsEditMode(false);
            navigate(`/agreements/${selectedAgreement?.id}`);
        } else {
            goBack();
        }
    };

    const handleSave = React.useCallback(
        async (savedViaModal, suppressErrorAlert = false, suppressSuccessAlert = false) => {
            try {
                let isThereAnyBLIsFinancialSnapshotChanged = false;
                if (!agreement.id) {
                    // creating new agreement
                    const newServicesComponents = servicesComponents
                        .filter((sc) => !("created_on" in sc))
                        // eslint-disable-next-line no-unused-vars
                        .map(({ display_title, has_changed, popStartDate, popEndDate, mode, ...sc }) => ({
                            ...sc,
                            ref: display_title
                        }));

                    const newGrantNumbers = grantNumbers
                        .filter((gn) => !("created_on" in gn))
                        // eslint-disable-next-line no-unused-vars
                        .map(({ display_title, popStartDate, popEndDate, mode, has_changed, ...gn }) => ({
                            ...gn,
                            ref: display_title
                        }));

                    const newBudgetLineItems = tempBudgetLines
                        .filter((budgetLineItem) => !("created_on" in budgetLineItem))
                        .map((bli) => {
                            if (isGrant) {
                                // Link the new grant BLI to a not-yet-persisted grant number by ref.
                                const matchedGrantNumber = newGrantNumbers.find(
                                    (gn) => gn.number === bli.grant_number_number
                                );
                                // eslint-disable-next-line no-unused-vars
                                const { grant_number_number, ...bliWithoutGnNumber } = bli;
                                return {
                                    ...bliWithoutGnNumber,
                                    grant_number_ref: matchedGrantNumber?.ref ?? null
                                };
                            }

                            const matchedServiceComponent = newServicesComponents.find(
                                (sc) => sc.number === bli.services_component_number
                            );

                            // Create new object without services_component_number
                            // eslint-disable-next-line
                            const { services_component_number, ...bliWithoutScNumber } = bli;

                            return {
                                ...bliWithoutScNumber,
                                services_component_ref: matchedServiceComponent?.ref ?? null
                            };
                        });

                    const data = {
                        ...agreement,
                        team_members: (agreement.team_members ?? []).map((team_member) => {
                            return formatTeamMember(team_member);
                        }),
                        requesting_agency_id: agreement.requesting_agency?.id ?? null,
                        servicing_agency_id: agreement.servicing_agency?.id ?? null
                    };
                    // Remove unnecessary fields from data to cut down on payload size and reduce potential errors
                    const { cleanData } = cleanAgreementForApi(data);
                    const cleanBudgetLines = cleanBudgetLineItemsForApi(newBudgetLineItems);
                    const createAgreementPayload = {
                        ...cleanData,
                        budget_line_items: cleanBudgetLines,
                        services_components: newServicesComponents,
                        grant_numbers: newGrantNumbers
                    };

                    const fulfilled = await addAgreement(createAgreementPayload).unwrap();
                    console.log(`CREATE: agreement success: ${JSON.stringify(fulfilled, null, 2)}`);
                } else {
                    // editing existing agreement
                    const newServicesComponents = servicesComponents.filter((sc) => !("created_on" in sc));

                    const existingServicesComponents = servicesComponents.filter((sc) => "created_on" in sc);
                    const changedServicesComponents = existingServicesComponents.filter((sc) => sc.has_changed);

                    const serviceComponentsCreationPromises = newServicesComponents.map((sc) => {
                        // eslint-disable-next-line no-unused-vars
                        const { display_title, has_changed, popStartDate, popEndDate, mode, ...cleanSc } = sc;
                        return addServicesComponent(cleanSc).unwrap();
                    });
                    const serviceComponentsUpdatePromises = changedServicesComponents.map((sc) => {
                        // eslint-disable-next-line no-unused-vars
                        const { display_title, has_changed, popStartDate, popEndDate, mode, ...cleanSc } = sc;
                        return updateServicesComponent({ id: sc.id, data: cleanSc }).unwrap();
                    });

                    const createdServiceComponents = await Promise.all(serviceComponentsCreationPromises);
                    await Promise.all(serviceComponentsUpdatePromises);

                    // Grant numbers, mirroring the SC create/update above. They must be persisted
                    // BEFORE the BLIs so grant BLIs can resolve grant_number_id. See plan §11.
                    const newGrantNumbers = grantNumbers.filter((gn) => !("created_on" in gn));
                    const existingGrantNumbers = grantNumbers.filter((gn) => "created_on" in gn);
                    const changedGrantNumbers = existingGrantNumbers.filter((gn) => gn.has_changed);

                    const grantNumberCreationPromises = newGrantNumbers.map((gn) => {
                        // eslint-disable-next-line no-unused-vars
                        const { display_title, has_changed, popStartDate, popEndDate, mode, ...cleanGn } = gn;
                        return addGrantNumber(cleanGn).unwrap();
                    });
                    const grantNumberUpdatePromises = changedGrantNumbers.map((gn) => {
                        // eslint-disable-next-line no-unused-vars
                        const { display_title, has_changed, popStartDate, popEndDate, mode, ...cleanGn } = gn;
                        return updateGrantNumber({ id: gn.id, data: cleanGn }).unwrap();
                    });

                    const createdGrantNumbers = await Promise.all(grantNumberCreationPromises);
                    await Promise.all(grantNumberUpdatePromises);

                    const newBudgetLineItems = tempBudgetLines.filter(
                        (budgetLineItem) => !("created_on" in budgetLineItem)
                    );
                    const existingBudgetLineItems = tempBudgetLines.filter(
                        (budgetLineItem) => "created_on" in budgetLineItem
                    );
                    const allServicesComponents = [...createdServiceComponents, ...existingServicesComponents];
                    const allGrantNumbers = [...createdGrantNumbers, ...existingGrantNumbers];

                    // Grant BLIs link via grant_number_id; contract/other BLIs via services_component_id.
                    const addLinkToBLI = (bli) =>
                        isGrant
                            ? addGrantNumberIdToBLI(bli, allGrantNumbers)
                            : addServiceComponentIdToBLI(bli, allServicesComponents);

                    const newBudgetLineItemsWithIds = newBudgetLineItems.map((newBLI) => addLinkToBLI(newBLI));

                    const existingBudgetLineItemsWithIds = existingBudgetLineItems.map((existingBLI) =>
                        addLinkToBLI(existingBLI)
                    );
                    // Create new budget line items
                    const creationPromises = newBudgetLineItemsWithIds.map((newBudgetLineItem) => {
                        const { data: cleanNewBLI } = cleanBudgetLineItemForApi(newBudgetLineItem);
                        return addBudgetLineItem(cleanNewBLI).unwrap();
                    });

                    await Promise.all(creationPromises);
                    console.log(`${creationPromises.length} new budget lines created successfully`);

                    isThereAnyBLIsFinancialSnapshotChanged = tempBudgetLines.some(
                        (tempBudgetLine) => tempBudgetLine.financialSnapshotChanged
                    );

                    if (isThereAnyBLIsFinancialSnapshotChanged && !canEditDirectly && !savedViaModal) {
                        await handleFinancialSnapshotChanges(existingBudgetLineItemsWithIds);
                    } else if (isThereAnyBLIsFinancialSnapshotChanged && !canEditDirectly && savedViaModal) {
                        await handleFinancialSnapshotChangesViaBlocker(existingBudgetLineItemsWithIds);
                    } else {
                        await handleRegularUpdates(existingBudgetLineItemsWithIds);
                    }
                    await handleDeletions();
                }
                suite.reset();
                budgetFormSuite.reset();
                datePickerSuite.reset();
                resetForm();
                setIsEditMode(false);
                if (!suppressSuccessAlert) {
                    showSuccessMessage(isThereAnyBLIsFinancialSnapshotChanged, savedViaModal);
                }
            } catch (error) {
                console.error("Error:", error);
                if (suppressErrorAlert) {
                    throw error;
                }
                setAlert({
                    type: "error",
                    heading: "Error",
                    message: "An error occurred while saving. Please try again.",
                    redirectUrl: "/error"
                });
            } finally {
                setIsEditMode(false);
                setHasUnsavedChanges(false);
                scrollToTop();
            }
        },
        [
            servicesComponents,
            grantNumbers,
            isGrant,
            tempBudgetLines,
            addServicesComponent,
            updateServicesComponent,
            addGrantNumber,
            updateGrantNumber,
            addBudgetLineItem,
            setAlert,
            canEditDirectly,
            handleFinancialSnapshotChanges,
            handleFinancialSnapshotChangesViaBlocker,
            handleRegularUpdates,
            handleDeletions,
            setIsEditMode,
            showSuccessMessage,
            resetForm,
            agreement,
            addAgreement
        ]
    );

    const hasFinancialSnapshotChanges = tempBudgetLines
        .filter((b) => !b.in_review)
        .some((b) => b.financialSnapshotChanged);
    const requiresFinancialApproval = !canEditDirectly && hasFinancialSnapshotChanges;

    const handleSaveRef = React.useRef(handleSave);

    React.useEffect(() => {
        handleSaveRef.current = handleSave;
    }, [handleSave]);

    const blockerRef = React.useRef(blocker);

    React.useEffect(() => {
        blockerRef.current = blocker;
    }, [blocker]);

    const proceedIfBlocked = async () => {
        const currentBlocker = blockerRef.current;
        if (!currentBlocker || currentBlocker.state !== "blocked") {
            return;
        }
        try {
            await currentBlocker.proceed();
        } catch (error) {
            const message = error && typeof error.message === "string" ? error.message.trim() : "";
            if (message.startsWith("Invalid blocker state transition")) {
                console.warn("Ignored known React Router blocker exception:", message);
                return;
            }
            throw error;
        }
    };

    React.useEffect(() => {
        if (blocker.state === "blocked") {
            const destination = blocker.location?.pathname;
            // Only surface the "require approval" wording when the changes actually route for
            // review. With the capability ON (and the edits in the flag's scope) they apply
            // immediately, so fall through to the neutral "Save Changes" copy.
            const modalContent = requiresFinancialApproval
                ? {
                      heading: "Save changes before leaving?",
                      description:
                          "You have unsaved changes and some will require approval from your Division Director if you save. If you leave without saving, these changes will be lost.",
                      actionButtonText: "Save & Send to Approval",
                      secondaryButtonText: "Leave without saving"
                  }
                : {
                      heading: "Save changes before leaving?",
                      description: "You have unsaved changes. If you leave without saving, these changes will be lost.",
                      actionButtonText: "Save Changes",
                      secondaryButtonText: "Leave without saving"
                  };
            setShowSaveChangesModal(true);
            setModalProps({
                ...modalContent,
                handleConfirm: async () => {
                    await handleSaveRef.current(true);
                    setShowSaveChangesModal(false);
                    blocker.reset();
                    if (destination) {
                        navigate(destination);
                    }
                },
                handleSecondary: async () => {
                    setHasUnsavedChanges(false);
                    setShowSaveChangesModal(false);
                    setIsEditMode(false);
                    await proceedIfBlocked();
                },
                closeModal: () => {
                    blocker.reset();
                }
            });
        }
    }, [blocker, requiresFinancialApproval, setIsEditMode, navigate]);

    return {
        blocker,
        budgetFormSuite,
        budgetLineBeingEdited,
        budgetLinePageErrorsExist,
        budgetLines,
        budgetLinesForCards,
        datePickerSuite,
        scFormSuite,
        nonDraftBudgetLines,
        deletedBudgetLines,
        enteredAmount,
        enteredDescription,
        feesForCards,
        groupedBudgetLinesByServicesComponent,
        groupedBudgetLinesByGrantNumber,
        grantNumbers,
        handleAddBLI,
        handleCancel,
        handleDeleteBudgetLine,
        handleDuplicateBudgetLine,
        handleEditBLI,
        hasUnsavedChanges,
        setHasUnsavedChanges,
        handleGoBack,
        handleResetForm: resetForm,
        handleSave,
        handleSetBudgetLineForEditingById,
        isBudgetLineNotDraft,
        isEditing,
        modalProps,
        needByDate,
        pageErrors: budgetLinePageErrors,
        res,
        selectedCan,
        servicesComponents,
        servicesComponentNumber,
        grantNumberNumber,
        setGrantNumberNumber,
        setEnteredAmount,
        setEnteredDescription,
        setModalProps,
        setNeedByDate,
        setSelectedCan,
        setServicesComponentNumber,
        setShowModal,
        showSaveChangesModal,
        setShowSaveChangesModal,
        showModal,
        subTotalForCards,
        tempBudgetLines,
        totalsForCards,
        isAgreementNotYetDeveloped,
        requiresFinancialApproval,
        effectiveScStartDate,
        effectiveScEndDate
    };
};

export default useCreateBLIsAndSCs;
