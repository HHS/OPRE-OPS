import cryptoRandomString from "crypto-random-string";
import React from "react";
import { useNavigate } from "react-router-dom";
import {
    useAddBudgetLineItemMutation,
    useDeleteAgreementMutation,
    useDeleteBudgetLineItemMutation,
    useGetCansQuery,
    useUpdateBudgetLineItemMutation
} from "../../../api/opsAPI";
import { getProcurementShopSubTotal, isNotDevelopedYet } from "../../../helpers/agreement.helpers";
import {
    BLI_STATUS,
    BLILabel,
    budgetLinesTotal,
    getNonDRAFTBudgetLines,
    groupByServicesComponent
} from "../../../helpers/budgetLines.helpers";
import { formatDateForApi, formatDateForScreen, renderField } from "../../../helpers/utils";
import useAlert from "../../../hooks/use-alert.hooks";
import { useGetLoggedInUserFullName } from "../../../hooks/user.hooks";
import datePickerSuite from "../BudgetLinesForm/datePickerSuite";
import budgetFormSuite from "../BudgetLinesForm/suite";
import suite from "./suite";
import { scrollToTop } from "../../../helpers/scrollToTop.helper";
import { useSelector } from "react-redux";
import { USER_ROLES } from "../../Users/User.constants";
import useSimpleNavigationBlocker from "../../../hooks/useSimpleNavigationBlocker";


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
 * @param {Object} formData - The form data.
 * @param {boolean} includeDrafts - Flag to include drafts budget lines.
 * @param {boolean} canUserEditBudgetLines - Flag to indicate if the user can edit budget lines.
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
    formData,
    includeDrafts,
    canUserEditBudgetLines
) => {


    const [servicesComponentId, setServicesComponentId] = React.useState(null);
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
    const [isSaving, setIsSaving] = React.useState(false);
    const navigate = useNavigate();
    const { setAlert } = useAlert();
    const [deleteAgreement] = useDeleteAgreementMutation();
    const [updateBudgetLineItem] = useUpdateBudgetLineItemMutation();
    const [addBudgetLineItem] = useAddBudgetLineItemMutation();
    const [deleteBudgetLineItem] = useDeleteBudgetLineItemMutation();
    const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
    const [servicesComponentsHasUnsavedChanges, setServicesComponentsHasUnsavedChanges] = React.useState(false);

    // Combined unsaved changes state for navigation blocking
    const hasAnyUnsavedChanges = hasUnsavedChanges || servicesComponentsHasUnsavedChanges;
    const loggedInUserFullName = useGetLoggedInUserFullName();
    const { data: cans } = useGetCansQuery({});
    const isAgreementNotYetDeveloped = isNotDevelopedYet(selectedAgreement.agreement_type);

    const activeUser = useSelector((state) => state.auth.activeUser);
    const userRoles = activeUser?.roles ?? [];
    const isSuperUser = userRoles.includes(USER_ROLES.SUPER_USER);

    React.useEffect(() => {
        let newTempBudgetLines =
            (budgetLines && budgetLines.length > 0 ? budgetLines : null) ??
            (formData && formData.tempBudgetLines && formData.tempBudgetLines.length > 0
                ? formData.tempBudgetLines
                : null) ??
            [];
        setTempBudgetLines(newTempBudgetLines);
    }, [formData, budgetLines]);

    React.useEffect(() => {
        setGroupedBudgetLinesByServicesComponent(groupByServicesComponent(tempBudgetLines));
    }, [tempBudgetLines]);

    // Validation
    let res = suite.get();
    const pageErrors = res.getErrors();

    if (isReviewMode) {
        suite({
            budgetLines: tempBudgetLines
        });
    }
    const budgetLinePageErrors = Object.entries(pageErrors).filter((error) => error[0].includes("Budget line item"));
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
     * @param {Object[]} budgetLines - The budget lines
     * @returns {number} - The sub total
     * */
    const subTotalForCards = (budgetLines) => budgetLinesTotal(budgetLines);
    /**
     * Get the totals for the cards
     * @param {number} subTotal - The sub total
     * @param {Object[]} budgetLines - The budget lines
     * @returns {number} - The total
     * */
    const totalsForCards = (subTotal, budgetLines) =>
        subTotal + getProcurementShopSubTotal(selectedAgreement, budgetLines);

    const handleSave = React.useCallback(async (options = {}) => {
        const { showSuccessAlert = true, performNavigation = true } = options;
        try {
            setIsSaving(true); // May use this later
            const newBudgetLineItems = tempBudgetLines.filter((budgetLineItem) => !("created_on" in budgetLineItem));
            const existingBudgetLineItems = tempBudgetLines.filter((budgetLineItem) => "created_on" in budgetLineItem);

            // Create new budget line items
            const creationPromises = newBudgetLineItems.map((newBudgetLineItem) => {
                const { data: cleanNewBLI } = cleanBudgetLineItemForApi(newBudgetLineItem);
                return addBudgetLineItem(cleanNewBLI).unwrap();
            });

            await Promise.all(creationPromises);
            console.log(`${creationPromises.length} new budget lines created successfully`);

            const isThereAnyBLIsFinancialSnapshotChanged = tempBudgetLines.some(
                (tempBudgetLine) => tempBudgetLine.financialSnapshotChanged
            );

            if (isThereAnyBLIsFinancialSnapshotChanged && !isSuperUser) {
                await handleFinancialSnapshotChanges(existingBudgetLineItems);
            } else {
                await handleRegularUpdates(existingBudgetLineItems);
            }

            await handleDeletions();

            suite.reset();
            budgetFormSuite.reset();
            datePickerSuite.reset();
            if (performNavigation) {
                resetForm();
                setIsEditMode(false);
            }
setHasUnsavedChanges(false);
            setServicesComponentsHasUnsavedChanges(false);
            if (showSuccessAlert) {
                showSuccessMessage(isThereAnyBLIsFinancialSnapshotChanged);
            }
        } catch (error) {
            console.error("Error saving budget lines:", error);
            setAlert({
                type: "error",
                heading: "Error",
                message: "An error occurred while saving. Please try again.",
                redirectUrl: "/error"
            });
        } finally {
            setIsSaving(false);
            setIsEditMode(false);
            scrollToTop();
        }
    }, [
        tempBudgetLines,
        addBudgetLineItem,
        isSuperUser,
        setIsEditMode,
        setHasUnsavedChanges,
        setAlert
    ]);
    /**
     * Handle saving the budget lines with financial snapshot changes
     * @param {import("../../../types/BudgetLineTypes").BudgetLine[]} existingBudgetLineItems - The existing budget line items
     * @returns {Promise<void>} - The promise
     */
const handleFinancialSnapshotChanges = async (existingBudgetLineItems) => {
        const updatePromises = existingBudgetLineItems.map(async (existingBudgetLineItem) => {
            let budgetLineHasChanged =
                JSON.stringify(existingBudgetLineItem) !==
                JSON.stringify(budgetLines.find((bli) => bli.id === existingBudgetLineItem.id));
            if (budgetLineHasChanged) {
                const { id, data: cleanExistingBLI } =
                    cleanBudgetLineItemForApi(existingBudgetLineItem);
                return updateBudgetLineItem({ id, data: cleanExistingBLI }).unwrap();
            }
        });

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
                    "Your changes have been successfully sent to your Division Director to review. Once approved, they will update on agreement.",
                redirectUrl: `/agreements/${selectedAgreement?.id}`
            });
        }
    };
    /**
     * Handle saving the budget lines without financial snapshot changes
     * @param {import("../../../types/BudgetLineTypes").BudgetLine[]} existingBudgetLineItems - The existing budget line items
     * @returns {Promise<void>} - The promise
     */
    const handleRegularUpdates = async (existingBudgetLineItems) => {
        try {
            const updatePromises = existingBudgetLineItems.map(async (existingBudgetLineItem) => {
                let budgetLineHasChanged =
                    JSON.stringify(existingBudgetLineItem) !==
                    JSON.stringify(budgetLines.find((bli) => bli.id === existingBudgetLineItem.id));

                if (budgetLineHasChanged) {
                    const { id, data: cleanExistingBLI } = cleanBudgetLineItemForApi(existingBudgetLineItem);
                    return updateBudgetLineItem({ id, data: cleanExistingBLI }).unwrap();
                }
            });

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
    };

    const handleDeletions = async () => {
        try {
            const deletionPromises = deletedBudgetLines.map((deletedBudgetLine) =>
                deleteBudgetLineItem(deletedBudgetLine.id).unwrap()
            );

            await Promise.all(deletionPromises);
        } catch (error) {
            console.error("Error deleting budget lines:", error);
            setAlert({
                type: "error",
                heading: "Error",
                message: "An error occurred while deleting budget lines. Please try again."
            });
        }
    };

    /**
     * function to create a message for the alert
     * @param {import("../../../types/BudgetLineTypes").BudgetLine[]} tempBudgetLines - The temporary budget lines
     * @returns {string} - The message(s) to display in the Alert in bullet points
     */
    const createBudgetChangeMessages = (tempBudgetLines) => {
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
    };

    /**
     * Show the success message
     * @param {boolean} isThereAnyBLIsFinancialSnapshotChanged - Flag to indicate if there are financial snapshot changes
     * @returns {void}
     */
    const showSuccessMessage = (isThereAnyBLIsFinancialSnapshotChanged) => {
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
                    `${budgetChangeMessages}`,
                redirectUrl: `/agreements/${selectedAgreement?.id}`
            });
        } else {
            setAlert({
                type: "success",
                heading: "Agreement Updated",
                message: `The agreement ${selectedAgreement?.display_name} has been successfully updated.`,
                redirectUrl: `/agreements/${selectedAgreement?.id}`
            });
        }
    };
    /**
     * Handle adding a budget line
     * @param {Event} e - The event object
     * @returns {void}
     */
    const handleAddBLI = (e) => {
        e.preventDefault();
        const newBudgetLine = {
            id: cryptoRandomString({ length: 10 }),
            services_component_id: servicesComponentId,
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
            message: `Budget line ${BLILabel(newBudgetLine)} was updated. When you're done editing, click Save & Exit below.`,
            isCloseable: false
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
            services_component_id: servicesComponentId,
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
            isCloseable: false
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
        const BLIToDelete = tempBudgetLines.filter((bl) => bl.id === budgetLineId);
        setDeletedBudgetLines([...deletedBudgetLines, BLIToDelete[0]]);
        setTempBudgetLines(tempBudgetLines.filter((bl) => bl.id !== budgetLineId));
        setHasUnsavedChanges(true);
        setAlert({
            type: "success",
            message: `The budget line ${BLILabel(budgetLine)} has been successfully deleted.`,
            isCloseable: false
        });
        resetForm();
    };

    const cleanBudgetLineItemForApi = (data) => {
        const cleanData = { ...data };
        if (data.services_component_id === 0) {
            cleanData.services_component_id = null;
        }
        if (cleanData.date_needed === "--") {
            cleanData.date_needed = null;
        }
        const budgetLineId = cleanData.id;
        delete cleanData.created_by;
        delete cleanData.created_on;
        delete cleanData.updated_on;
        delete cleanData.can;
        delete cleanData.id;
        delete cleanData.in_review;
        delete cleanData.canDisplayName;
        delete cleanData.versions;
        delete cleanData.clin;
        delete cleanData.agreement;
        delete cleanData.financialSnapshotChanged;
        delete cleanData.fees;

        return { id: budgetLineId, data: cleanData };
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
            const { services_component_id, line_description, can, amount, date_needed } = tempBudgetLines[index];
            const dateForScreen = formatDateForScreen(date_needed);

            setBudgetLineBeingEdited(index);
            setServicesComponentId(services_component_id);
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
                        message: "An error occurred while deleting agreement.",
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
    };


    // Navigation blocker for browser navigation events (back button, URL changes, etc.)
    // This is separate from handleGoBack which handles manual "Back" button clicks
    const handleNavigationConfirm = React.useCallback(async () => {
        try {
            // Save without showing success alert or performing navigation
            // The navigation blocker will handle the navigation after this completes
            await handleSave({ showSuccessAlert: false, performNavigation: false });
        } catch (error) {
            console.error("Error saving during navigation:", error);
            throw error; // Re-throw to prevent navigation on save error
        }
    }, [handleSave]);

    const handleNavigationSecondary = React.useCallback(() => {
        setHasUnsavedChanges(false);
        setServicesComponentsHasUnsavedChanges(false);
    }, []);

    const navigationModalProps = React.useMemo(() => ({
        heading: "Save changes before leaving?",
        description: "You have unsaved changes. If you continue without saving, these changes will be lost.",
        actionButtonText: "Save and Leave",
        secondaryButtonText: "Leave Without Saving",
        handleConfirm: handleNavigationConfirm,
        handleSecondary: handleNavigationSecondary
    }), [handleNavigationConfirm, handleNavigationSecondary]);

    const { showModal, modalProps, setShowModal } = useSimpleNavigationBlocker({
        shouldBlock: hasAnyUnsavedChanges,
        modalProps: navigationModalProps
    });
    const handleGoBack = () => {
        // Navigation is now handled by the NavigationBlockerContext
        // Just proceed with navigation logic - the blocker will intercept if needed
        proceedWithNavigation();
    };

    const proceedWithNavigation = () => {
        if (workflow === "none") {
            setIsEditMode(false);
            navigate(`/agreements/${selectedAgreement?.id}`);
        } else {
            goBack({ tempBudgetLines });
        }
    };

    const resetForm = () => {
        setIsEditing(false);
        setServicesComponentId(null);
        setSelectedCan(null);
        setEnteredAmount(null);
        setNeedByDate(null);
        setEnteredDescription(null);
        setBudgetLineBeingEdited(null);
        suite.reset();
        budgetFormSuite.reset();
        datePickerSuite.reset();
    };

    return {
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
        isSaving,
        modalProps,
        needByDate,
        pageErrors,
        res,
        selectedCan,
        servicesComponentId,
        setEnteredAmount,
        setEnteredDescription,

        setNeedByDate,
        setSelectedCan,
        setServicesComponentId,
        setShowModal,

        showModal,
        subTotalForCards,
        tempBudgetLines,
        totalsForCards,
        isAgreementNotYetDeveloped,
        setServicesComponentsHasUnsavedChanges
    };
};

export default useCreateBLIsAndSCs;
