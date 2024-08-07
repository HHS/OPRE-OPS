import cryptoRandomString from "crypto-random-string";
import PropTypes from "prop-types";
import React from "react";
import { useNavigate } from "react-router-dom";
import {
    useAddBudgetLineItemMutation,
    useDeleteAgreementMutation,
    useDeleteBudgetLineItemMutation,
    useUpdateBudgetLineItemMutation
} from "../../../api/opsAPI";
import { getProcurementShopSubTotal } from "../../../helpers/agreement.helpers";
import {
    BLI_STATUS,
    BLILabel,
    budgetLinesTotal,
    getNonDRAFTBudgetLines,
    groupByServicesComponent
} from "../../../helpers/budgetLines.helpers";
import { formatDateForApi, formatDateForScreen } from "../../../helpers/utils";
import useAlert from "../../../hooks/use-alert.hooks";
import { useGetLoggedInUserFullName } from "../../../hooks/user.hooks";
import suite from "./suite";

/**
 * Custom hook to manage the creation and manipulation of Budget Line Items and Service Components.
 *
 * @param {Function} setIsEditMode - Function to set the edit mode.
 * @param {boolean} isReviewMode - Flag to indicate if the component is in review mode.
 * @param {boolean} isEditMode - Flag to indicate if the component is in edit mode.
 * @param {Object[]} budgetLines - Array of budget lines.
 * @param {Function} goToNext - Function to navigate to the next step.
 * @param {Function} goBack - Function to navigate to the previous step.
 * @param {Function} continueOverRide - Function to override the continue action.
 * @param {Object} selectedAgreement - Selected agreement object.
 * @param {Object} selectedProcurementShop - Selected procurement shop object.
 * @param {string} workflow - The workflow type ("agreement" or "budgetLines").
 * @param {Object} formData - The form data.
 * @param {boolean} includeDrafts - Flag to include drafts budget lines
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
    includeDrafts
) => {
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({});
    const [servicesComponentId, setServicesComponentId] = React.useState(null);
    const [selectedCan, setSelectedCan] = React.useState(null);
    const [enteredAmount, setEnteredAmount] = React.useState(null);
    const [needByDate, setNeedByDate] = React.useState(null);
    const [enteredComments, setEnteredComments] = React.useState(null);
    const [isEditing, setIsEditing] = React.useState(false);
    const [budgetLineBeingEdited, setBudgetLineBeingEdited] = React.useState(null);
    const [financialSnapshot, setFinancialSnapshot] = React.useState({});
    const searchParams = new URLSearchParams(location.search);
    const [budgetLineIdFromUrl, setBudgetLineIdFromUrl] = React.useState(
        () => searchParams.get("budget-line-id") || null
    );
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
    const loggedInUserFullName = useGetLoggedInUserFullName();

    const handleSetBudgetLineFromUrl = () => {
        if (!budgetLineIdFromUrl) return;
        setIsEditMode(true);
        const selectedBudgetLine = budgetLines.find(({ id }) => id === Number(budgetLineIdFromUrl));

        if (selectedBudgetLine) {
            handleSetBudgetLineForEditingById(selectedBudgetLine.id);
        }
    };

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

    React.useEffect(handleSetBudgetLineFromUrl, [budgetLineIdFromUrl, budgetLines, tempBudgetLines]);

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
     * @param {Object[]} budgetLines - The budget lines
     * @returns {number} - The total fees
     */
    const feesForCards = (budgetLines) => getProcurementShopSubTotal(selectedAgreement, budgetLines);
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

    const handleSave = async () => {
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

            if (isThereAnyBLIsFinancialSnapshotChanged) {
                await handleFinancialSnapshotChanges(existingBudgetLineItems);
            } else {
                await handleRegularUpdates(existingBudgetLineItems);
            }

            await handleDeletions();

            resetForm();
            setIsEditMode(false);
            showSuccessMessage(isThereAnyBLIsFinancialSnapshotChanged);
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
        }
    };
    /**
     * Handle saving the budget lines with financial snapshot changes
     * @param {Object[]} existingBudgetLineItems - The existing budget line items
     * @returns {Promise<void>} - The promise
     */
    const handleFinancialSnapshotChanges = async (existingBudgetLineItems) => {
        return new Promise((resolve, reject) => {
            setShowModal(true);
            setModalProps({
                heading:
                    "Budget changes require approval from your Division Director. Do you want to send it to approval?",
                actionButtonText: "Send to Approval",
                secondaryButtonText: "Continue Editing",
                handleConfirm: async () => {
                    try {
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
                        setIsEditMode(false);

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
                    }
                },
                handleSecondary: () => {
                    resolve(); // Resolve without making changes if user chooses to continue editing
                }
            });
        });
    };
    /**
     * Handle saving the budget lines without financial snapshot changes
     * @param {Object[]} existingBudgetLineItems - The existing budget line items
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
     * Show the success message
     * @param {boolean} isThereAnyBLIsFinancialSnapshotChanged - Flag to indicate if there are financial snapshot changes
     * @returns {void}
     */
    const showSuccessMessage = (isThereAnyBLIsFinancialSnapshotChanged) => {
        if (continueOverRide) {
            continueOverRide();
        } else if (isThereAnyBLIsFinancialSnapshotChanged) {
            setAlert({
                type: "success",
                heading: "Changes Sent to Approval",
                message:
                    "Your changes have been successfully sent to your Division Director to review. Once approved, they will update on the agreement.",
                redirectUrl: `/agreements/${selectedAgreement?.id}`
            });
        } else {
            setAlert({
                type: "success",
                heading: "Budget Lines Saved",
                message: "All budget lines have been successfully updated.",
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
            comments: enteredComments || "",
            can_id: selectedCan?.id || null,
            can: selectedCan || null,
            canDisplayName: selectedCan?.display_name || null,
            agreement_id: selectedAgreement?.id || null,
            amount: enteredAmount || 0,
            status: "DRAFT",
            date_needed: formatDateForApi(needByDate),
            proc_shop_fee_percentage: selectedProcurementShop?.fee || null
        };
        setTempBudgetLines([...tempBudgetLines, newBudgetLine]);
        setAlert({
            type: "success",
            heading: "Budget Line Added",
            message: "The budget line has been successfully added."
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

        const amountChanged = financialSnapshot.enteredAmount !== enteredAmount;
        const dateChanged = financialSnapshot.needByDate !== needByDate;
        const canChanged = financialSnapshot.selectedCanId !== selectedCan?.id;
        const financialSnapshotChanged = amountChanged || dateChanged || canChanged;
        const BLIStatusIsPlannedOrExecuting =
            budgetLines[budgetLineBeingEdited]?.status === BLI_STATUS.PLANNED ||
            budgetLines[budgetLineBeingEdited]?.status === BLI_STATUS.EXECUTING;

        const payload = {
            ...tempBudgetLines[budgetLineBeingEdited],
            id: tempBudgetLines[budgetLineBeingEdited].id,
            services_component_id: servicesComponentId,
            comments: enteredComments || "",
            can_id: selectedCan?.id || null,
            can: selectedCan || null,
            canDisplayName: selectedCan?.display_name || null,
            agreement_id: selectedAgreement?.id || null,
            amount: enteredAmount || 0,
            status: tempBudgetLines[budgetLineBeingEdited].status || "DRAFT",
            date_needed: formatDateForApi(needByDate),
            proc_shop_fee_percentage: selectedProcurementShop?.fee || null
        };

        if (financialSnapshotChanged && BLIStatusIsPlannedOrExecuting) {
            const payloadPlusFinances = {
                ...payload,
                financialSnapshotChanged
            };
            setTempBudgetLines(
                tempBudgetLines.map((item, index) => (index === budgetLineBeingEdited ? payloadPlusFinances : item))
            );
            setAlert({
                type: "success",
                heading: "Budget Line Updated",
                message: "The budget line has been successfully edited."
            });
            resetForm();

            return;
        }

        setTempBudgetLines(tempBudgetLines.map((item, index) => (index === budgetLineBeingEdited ? payload : item)));

        if (budgetLineIdFromUrl) {
            resetQueryParams();
        }
        setAlert({
            type: "success",
            heading: "Budget Line Updated",
            message: "The budget line has been successfully edited."
        });
        resetForm();
    };
    /**
     * Handle deleting a budget line
     * @param {string} budgetLineId - The ID of the budget line to delete
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
                setAlert({
                    type: "success",
                    heading: "Budget Line Deleted",
                    message: `Budget line ${BLILabel(budgetLine)} has been successfully deleted.`
                });
                resetForm();
            }
        });
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

        return { id: budgetLineId, data: cleanData };
    };

    /**
     * Set the budget line for editing by its ID
     * @param {string} budgetLineId - The ID of the budget line to edit
     * @returns {void}
     */
    const handleSetBudgetLineForEditingById = (budgetLineId) => {
        const index = tempBudgetLines.findIndex((budgetLine) => budgetLine.id === budgetLineId);
        if (index !== -1) {
            const { services_component_id, comments, can, can_id, amount, date_needed } = tempBudgetLines[index];
            const dateForScreen = formatDateForScreen(date_needed);

            setBudgetLineBeingEdited(index);
            setServicesComponentId(services_component_id);
            setSelectedCan(can);
            setEnteredAmount(amount);
            setNeedByDate(dateForScreen);
            setEnteredComments(comments);
            setIsEditing(true);
            setFinancialSnapshot({ enteredAmount: amount, needByDate: dateForScreen, selectedCanId: can_id });
            setIsBudgetLineNotDraft(tempBudgetLines[index].status !== BLI_STATUS.DRAFT);
        }
    };
    /**
     * Handle duplicating a budget line
     * @param {string} budgetLineId - The ID of the budget line to duplicate
     * @returns {void}
     */
    const handleDuplicateBudgetLine = (budgetLineId) => {
        const budgetLine = tempBudgetLines.find((bl) => bl.id === budgetLineId);
        if (!budgetLine) {
            return;
        }
        const {
            services_component_id,
            comments,
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
            comments,
            can_id,
            can,
            canDisplayName: can?.display_name || null,
            agreement_id,
            amount,
            date_needed,
            proc_shop_fee_percentage,
            status: "DRAFT",
            created_by: loggedInUserFullName
        };
        setTempBudgetLines([...tempBudgetLines, payload]);
        resetForm();
    };

    const handleCancel = () => {
        const heading = `${
            isEditMode || isReviewMode
                ? "Are you sure you want to cancel editing? Your changes will not be saved."
                : "Are you sure you want to cancel creating a new agreement? Your progress will not be saved."
        }`;
        const actionButtonText = `${isEditMode ? "Cancel Edits" : "Cancel Agreement"}`;
        setShowModal(true);
        setModalProps({
            heading,
            actionButtonText,
            secondaryButtonText: "Continue Editing",
            handleConfirm: () => {
                if (isEditMode || isReviewMode) {
                    setIsEditMode(false);
                    resetForm();
                    setTempBudgetLines([]);
                    if (budgetLineIdFromUrl) {
                        resetQueryParams();
                    }
                    navigate(`/agreements/${selectedAgreement?.id}/budget-lines`);
                } else {
                    // TODO: Add logic to delete the agreement in the workflow
                    // Delete the agreement in the workflow
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
                        });
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

    const resetQueryParams = () => {
        setBudgetLineIdFromUrl(null);
        const url = new URL(window.location);
        url.searchParams.delete("budget-line-id");
        window.history.replaceState({}, "", url);
    };

    const resetForm = () => {
        setIsEditing(false);
        setServicesComponentId(null);
        setSelectedCan(null);
        setEnteredAmount(null);
        setNeedByDate(null);
        setEnteredComments(null);
        setFinancialSnapshot(null);
        setBudgetLineBeingEdited(null);
    };

    return {
        handleAddBLI,
        handleEditBLI,
        handleDeleteBudgetLine,
        handleResetForm: resetForm,
        handleSetBudgetLineForEditingById,
        handleDuplicateBudgetLine,
        isEditing,
        budgetLineBeingEdited,
        budgetLinePageErrorsExist,
        pageErrors,
        showModal,
        setShowModal,
        modalProps,
        setModalProps,
        setServicesComponentId,
        setSelectedCan,
        setEnteredAmount,
        setEnteredComments,
        resetQueryParams,
        selectedCan,
        enteredAmount,
        needByDate,
        setNeedByDate,
        enteredComments,
        servicesComponentId,
        budgetLines,
        groupedBudgetLinesByServicesComponent,
        res,
        feesForCards,
        subTotalForCards,
        totalsForCards,
        handleCancel,
        handleGoBack,
        tempBudgetLines,
        handleSave,
        deletedBudgetLines,
        budgetLinesForCards,
        isBudgetLineNotDraft,
        isSaving
    };
};

useCreateBLIsAndSCs.propTypes = {
    isReviewMode: PropTypes.bool,
    budgetLines: PropTypes.array,
    goToNext: PropTypes.func,
    goBack: PropTypes.func,
    continueOverRide: PropTypes.func,
    selectedAgreement: PropTypes.object,
    selectedProcurementShop: PropTypes.object,
    setIsEditMode: PropTypes.func,
    workflow: PropTypes.string
};

export default useCreateBLIsAndSCs;
