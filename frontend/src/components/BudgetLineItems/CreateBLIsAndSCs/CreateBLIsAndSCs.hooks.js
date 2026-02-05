import cryptoRandomString from "crypto-random-string";
import React from "react";
import { useSelector } from "react-redux";
import { useBlocker, useNavigate } from "react-router-dom";
import {
    useAddAgreementMutation,
    useAddBudgetLineItemMutation,
    useAddServicesComponentMutation,
    useDeleteAgreementMutation,
    useDeleteBudgetLineItemMutation,
    useDeleteServicesComponentMutation,
    useUpdateBudgetLineItemMutation,
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
    groupByServicesComponent
} from "../../../helpers/budgetLines.helpers";
import { scrollToTop } from "../../../helpers/scrollToTop.helper";
import { formatDateForApi, formatDateForScreen, renderField } from "../../../helpers/utils";
import useAlert from "../../../hooks/use-alert.hooks";
import { useGetAllCans } from "../../../hooks/useGetAllCans";
import { useGetLoggedInUserFullName } from "../../../hooks/user.hooks";
import { useEditAgreement } from "../../Agreements/AgreementEditor/AgreementEditorContext.hooks";
import datePickerSuite from "../BudgetLinesForm/datePickerSuite";
import budgetFormSuite from "../BudgetLinesForm/suite";
import suite from "./suite";

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
    const [selectedCan, setSelectedCan] = React.useState(null);
    const [enteredAmount, setEnteredAmount] = React.useState(null);
    const [needByDate, setNeedByDate] = React.useState(null);
    const [enteredDescription, setEnteredDescription] = React.useState(null);
    const [isEditing, setIsEditing] = React.useState(false);
    const [budgetLineBeingEdited, setBudgetLineBeingEdited] = React.useState(null);
    const [tempBudgetLines, setTempBudgetLines] = React.useState([]);
    const [groupedBudgetLinesByServicesComponent, setGroupedBudgetLinesByServicesComponent] = React.useState([]);
    const [deletedBudgetLines, setDeletedBudgetLines] = React.useState([]);
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
    const loggedInUserFullName = useGetLoggedInUserFullName();
    const { cans } = useGetAllCans();
    const isAgreementNotYetDeveloped = isNotDevelopedYet(selectedAgreement.agreement_type);
    const {
        agreement,
        services_components: servicesComponents,
        deleted_services_components_ids: deletedServicesComponentsIds
    } = useEditAgreement();

    const activeUser = useSelector((state) => state.auth.activeUser);
    const isSuperUser = activeUser?.is_superuser ?? false;

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

    React.useEffect(() => {
        let newTempBudgetLines = (budgetLines && budgetLines.length > 0 ? budgetLines : null) ?? [];
        newTempBudgetLines = newTempBudgetLines.map((bli) => {
            const budgetLineServicesComponent = servicesComponents?.find((sc) => sc.id === bli.services_component_id);
            const serviceComponentNumber = budgetLineServicesComponent?.number ?? 0;
            const serviceComponentGroupingLabel = budgetLineServicesComponent?.sub_component
                ? `${serviceComponentNumber}-${budgetLineServicesComponent?.sub_component}`
                : `${serviceComponentNumber}`;
            return { ...bli, services_component_number: serviceComponentNumber, serviceComponentGroupingLabel };
        });

        setTempBudgetLines(newTempBudgetLines);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    React.useEffect(() => {
        setGroupedBudgetLinesByServicesComponent(groupByServicesComponent(tempBudgetLines));
    }, [tempBudgetLines, servicesComponents]);

    // Validation
    let res = suite.get();
    const pageErrors = res.getErrors();

    if (isReviewMode) {
        suite({
            budgetLines: tempBudgetLines
        });
    }
    // Filter page errors to only include "Budget line item" errors and consolidate into single message
    const budgetLineErrors = Object.entries(pageErrors).filter((error) => error[0].includes("Budget line item"));

    const budgetLinePageErrors = budgetLineErrors.length > 0 ? [["This is required information"]] : [];
    const budgetLinePageErrorsExist = budgetLinePageErrors.length > 0;
    // card data
    const notDraftBLIs = getNonDRAFTBudgetLines(tempBudgetLines);
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
            const blisDeletionPromises = deletedBudgetLines.map((deletedBudgetLine) =>
                deleteBudgetLineItem(deletedBudgetLine.id).unwrap()
            );

            await Promise.all(blisDeletionPromises);
            await Promise.all(serviceComponentDeletionPromises);
        } catch (error) {
            console.error("Error deleting budget lines:", error);
            setAlert({
                type: "error",
                heading: "Error",
                message: "An error occurred while deleting budget lines. Please try again."
            });
        }
    }, [deletedServicesComponentsIds, deletedBudgetLines, deleteServicesComponent, deleteBudgetLineItem, setAlert]);

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
            if (continueOverRide) {
                continueOverRide();
            } else if (isThereAnyBLIsFinancialSnapshotChanged && !isSuperUser) {
                setAlert({
                    type: "success",
                    heading: "Changes Sent to Approval",
                    message:
                        `Your changes have been successfully sent to your Division Director to review. Once approved, they will update on the agreement.\n\n` +
                        `<strong>Pending Changes:</strong>\n` +
                        ` ${budgetChangeMessages}`,
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
            continueOverRide,
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
            line_description: enteredDescription || "",
            can_id: selectedCan?.id || null,
            can: selectedCan || null,
            canDisplayName: selectedCan?.display_name || null,
            agreement_id: selectedAgreement?.id || null,
            amount: enteredAmount || 0,
            status: BLI_STATUS.DRAFT,
            date_needed: formatDateForApi(needByDate),
            proc_shop_fee_percentage: selectedProcurementShop?.fee_percentage || null,
            fees: (enteredAmount ?? 0) * ((selectedProcurementShop?.fee_percentage ?? 0) / 100),
            _meta: { isEditable: true }
        };
        setTempBudgetLines([...tempBudgetLines, newBudgetLine]);
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

        if (
            budgetLineBeingEdited == null ||
            budgetLineBeingEdited < 0 ||
            budgetLineBeingEdited >= tempBudgetLines.length
        ) {
            console.error("Invalid budgetLineBeingEdited index");
            return;
        }

        const currentBudgetLine = tempBudgetLines[budgetLineBeingEdited];
        const originalBudgetLine = budgetLines[budgetLineBeingEdited];

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

        const payload = {
            ...currentBudgetLine,
            services_component_number: servicesComponentNumber,
            serviceComponentGroupingLabel: servicesComponentNumber.toString(),
            line_description: enteredDescription || "",
            can_id: selectedCan?.id || null,
            can: selectedCan || null,
            canDisplayName: selectedCan?.display_name || null,
            agreement_id: selectedAgreement?.id || null,
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
        /**
         * Update the tempBudgetLines array with the new payload of the budgetLineBeingEdited
         * @type {Object[]} updatedBudgetLines
         * @returns {void}
         */
        const updatedBudgetLines = tempBudgetLines.map((budgetLine, index) => {
            if (index === budgetLineBeingEdited) {
                return payload; // Replace the edited budget line with the new payload
            }
            return budgetLine; // Keep other budget lines unchanged
        });
        setTempBudgetLines(updatedBudgetLines);
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
                const BLIToDelete = tempBudgetLines.filter((bl) => bl.id === budgetLineId);
                setDeletedBudgetLines([...deletedBudgetLines, BLIToDelete[0]]);
                setTempBudgetLines(tempBudgetLines.filter((bl) => bl.id !== budgetLineId));
                setHasUnsavedChanges(true);
                setAlert({
                    type: "success",
                    message: `The budget line ${BLILabel(budgetLine)} has been successfully deleted.`,
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
                line_description,
                can,
                amount,
                date_needed
            } = tempBudgetLines[index];
            const dateForScreen = formatDateForScreen(date_needed);
            setBudgetLineBeingEdited(index);
            setServicesComponentNumber(serviceComponentNumber);
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
            line_description,
            can_id,
            can,
            canDisplayName: can?.display_name || null,
            agreement_id,
            amount,
            date_needed,
            proc_shop_fee_percentage,
            status: BLI_STATUS.DRAFT,
            created_by: loggedInUserFullName
        };
        setTempBudgetLines([...tempBudgetLines, payload]);
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
                    setTempBudgetLines([]);
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
            goBack({ tempBudgetLines });
        }
    };

    const handleSave = React.useCallback(
        async (savedViaModal) => {
            try {
                let isThereAnyBLIsFinancialSnapshotChanged = false;
                if (!agreement.id) {
                    // creating new agreement
                    const newServicesComponents = servicesComponents
                        .filter((sc) => !("created_on" in sc))
                        .map(({ display_title, ...sc }) => ({
                            ...sc,
                            ref: display_title
                        }));

                    const newBudgetLineItems = tempBudgetLines
                        .filter((budgetLineItem) => !("created_on" in budgetLineItem))
                        .map((bli) => {
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
                        services_components: newServicesComponents
                    };

                    const fulfilled = await addAgreement(createAgreementPayload).unwrap();
                    console.log(`CREATE: agreement success: ${JSON.stringify(fulfilled, null, 2)}`);
                } else {
                    // editing existing agreement
                    const newServicesComponents = servicesComponents.filter((sc) => !("created_on" in sc));

                    const existingServicesComponents = servicesComponents.filter((sc) => "created_on" in sc);
                    const changedServicesComponents = existingServicesComponents.filter((sc) => sc.has_changed);

                    const serviceComponentsCreationPromises = newServicesComponents.map((sc) => {
                        return addServicesComponent(sc).unwrap();
                    });
                    const serviceComponentsUpdatePromises = changedServicesComponents.map((sc) => {
                        return updateServicesComponent({ id: sc.id, data: sc }).unwrap();
                    });

                    const createdServiceComponents = await Promise.all(serviceComponentsCreationPromises);
                    await Promise.all(serviceComponentsUpdatePromises);

                    const newBudgetLineItems = tempBudgetLines.filter(
                        (budgetLineItem) => !("created_on" in budgetLineItem)
                    );
                    const existingBudgetLineItems = tempBudgetLines.filter(
                        (budgetLineItem) => "created_on" in budgetLineItem
                    );
                    const allServicesComponents = [...createdServiceComponents, ...existingServicesComponents];

                    const newBudgetLineItemsWithIds = newBudgetLineItems.map((newBLI) =>
                        addServiceComponentIdToBLI(newBLI, allServicesComponents)
                    );

                    const existingBudgetLineItemsWithIds = existingBudgetLineItems.map((existingBLI) =>
                        addServiceComponentIdToBLI(existingBLI, allServicesComponents)
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

                    if (isThereAnyBLIsFinancialSnapshotChanged && !isSuperUser && !savedViaModal) {
                        await handleFinancialSnapshotChanges(existingBudgetLineItemsWithIds);
                    } else if (isThereAnyBLIsFinancialSnapshotChanged && !isSuperUser && savedViaModal) {
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
                showSuccessMessage(isThereAnyBLIsFinancialSnapshotChanged, savedViaModal);
            } catch (error) {
                console.error("Error:", error);
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
            tempBudgetLines,
            addServicesComponent,
            updateServicesComponent,
            addBudgetLineItem,
            setAlert,
            isSuperUser,
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

    const hasFinancialSnapshotChanges = tempBudgetLines.some(
        (tempBudgetLine) => tempBudgetLine.financialSnapshotChanged
    );

    const handleSaveRef = React.useRef(handleSave);

    React.useEffect(() => {
        handleSaveRef.current = handleSave;
    }, [handleSave]);

    React.useEffect(() => {
        if (blocker.state === "blocked") {
            const proceedIfBlocked = () => {
                if (blocker.state === "blocked") {
                    blocker.proceed();
                }
            };
            const modalContent = hasFinancialSnapshotChanges
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
                      actionButtonText: "Save",
                      secondaryButtonText: "Leave without saving"
                  };
            setShowSaveChangesModal(true);
            setModalProps({
                ...modalContent,
                handleConfirm: async () => {
                    await handleSaveRef.current(true);
                    setShowSaveChangesModal(false);
                    proceedIfBlocked();
                },
                handleSecondary: () => {
                    setHasUnsavedChanges(false);
                    setShowSaveChangesModal(false);
                    setIsEditMode(false);
                    proceedIfBlocked();
                },
                closeModal: () => {
                    blocker.reset();
                }
            });
        }
    }, [blocker, hasFinancialSnapshotChanges, setIsEditMode]);

    return {
        blocker,
        budgetFormSuite,
        budgetLineBeingEdited,
        budgetLinePageErrorsExist,
        budgetLines,
        budgetLinesForCards,
        datePickerSuite,
        deletedBudgetLines,
        enteredAmount,
        enteredDescription,
        feesForCards,
        groupedBudgetLinesByServicesComponent,
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
        isAgreementNotYetDeveloped
    };
};

export default useCreateBLIsAndSCs;
