import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import suite from "./suite";
import useAlert from "../../../hooks/use-alert.hooks";
import {
    useUpdateBudgetLineItemMutation,
    useAddBudgetLineItemMutation,
    useDeleteAgreementMutation,
    useDeleteBudgetLineItemMutation
} from "../../../api/opsAPI";
import { useGetLoggedInUserFullName } from "../../../hooks/user.hooks";
import { budgetLinesTotal, BLILabel, canLabel, isBLIPermanent } from "../../../helpers/budgetLines.helpers";
import { getProcurementShopSubTotal } from "../../../helpers/agreement.helpers";
import { groupByServicesComponent, BLI_STATUS } from "../../../helpers/budgetLines.helpers";
import { formatDateForApi, formatDateForScreen } from "../../../helpers/utils";

/**
 * Custom hook to manage the creation and manipulation of Budget Line Items and Service Components.
 *
 * @param {boolean} isReviewMode - Flag to indicate if the component is in review mode.
 * @param {Array<any>} budgetLines - Array of budget lines.
 * @param {Function} goToNext - Function to navigate to the next step.
 * @param {Function} goBack - Function to navigate to the previous step.
 * @param {Function} continueOverRide - Function to override the continue action.
 * @param {Object} selectedAgreement - Selected agreement object.
 * @param {Object} selectedProcurementShop - Selected procurement shop object.
 * @param {Function} setIsEditMode - Function to set the edit mode.
 * @param {string} workflow - The workflow type ("agreement" or "budgetLines").
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
    workflow
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
    const [financialSnapshot, setFinancialSnapshot] = React.useState(null);
    const searchParams = new URLSearchParams(location.search);
    const [budgetLineIdFromUrl, setBudgetLineIdFromUrl] = React.useState(
        () => searchParams.get("budget-line-id") || null
    );
    const [tempBudgetLines, setTempBudgetLines] = React.useState(budgetLines || []);
    const navigate = useNavigate();
    const { setAlert } = useAlert();
    const [deleteAgreement] = useDeleteAgreementMutation();
    const [updateBudgetLineItem] = useUpdateBudgetLineItemMutation();
    const [addBudgetLineItem] = useAddBudgetLineItemMutation();
    const [deleteBudgetLineItem] = useDeleteBudgetLineItemMutation();
    const loggedInUserFullName = useGetLoggedInUserFullName();
    const feesForCards = getProcurementShopSubTotal(selectedAgreement, budgetLines);
    const subTotalForCards = budgetLinesTotal(budgetLines);
    const totalsForCards = subTotalForCards + getProcurementShopSubTotal(selectedAgreement, budgetLines);

    // console.log({ financialSnapshot });
    // console.log({ enteredAmount, needByDate, selectedCanId: selectedCan?.id });

    // Validation
    let res = suite.get();
    const pageErrors = res.getErrors();

    if (isReviewMode) {
        suite({
            new_budget_lines: budgetLines
        });
    }
    const budgetLinePageErrors = Object.entries(pageErrors).filter((error) => error[0].includes("Budget line item"));
    const budgetLinePageErrorsExist = budgetLinePageErrors.length > 0;

    // console.log({ budgetLines });
    // console.log({ tempBudgetLines });
    // console.log({ combinedBudgetLines });
    const groupedBudgetLinesByServicesComponent = groupByServicesComponent(tempBudgetLines);

    const handleAddBLI = (e) => {
        e.preventDefault();
        const newBudgetLine = {
            id: crypto.randomUUID(),
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
        // TODO: Batch add BLIs
        // const payload = {
        //     services_component_id: servicesComponentId,
        //     comments: enteredComments || "",
        //     can_id: selectedCan?.id || null,
        //     agreement_id: selectedAgreement?.id || null,
        //     amount: enteredAmount || 0,
        //     status: "DRAFT",
        //     date_needed: formatDateForApi(needByDate),
        //     proc_shop_fee_percentage: selectedProcurementShop?.fee || null
        // };
        // const { data } = cleanBudgetLineItemForApi(payload);
        // addBudgetLineItem(data)
        //     .unwrap()
        //     .then((fulfilled) => {
        //         console.log("Created New BLIs:", fulfilled);
        //     })
        //     .catch((rejected) => {
        //         console.error("Error Creating Budget Lines");
        //         console.error({ rejected });
        //         setAlert({
        //             type: "error",
        //             heading: "Error",
        //             message: "An error occurred. Please try again.",
        //             navigateUrl: "/error"
        //         });
        //     });
        // setAlert({
        //     type: "success",
        //     heading: "Budget Line Added",
        //     message: "The budget line has been successfully added."
        // });
        resetForm();
    };

    const handleEditBLI = (e) => {
        e.preventDefault();
        console.log({ budgetLineBeingEdited });
        // const amountChanged = financialSnapshot?.enteredAmount !== enteredAmount;
        // const dateChanged = financialSnapshot?.needByDate !== needByDate;
        // const canChanged = financialSnapshot.selectedCanId !== selectedCan?.id;
        // const financialSnapshotChanged = amountChanged || dateChanged || canChanged;
        // const BLIStatusIsPlannedOrExecuting =
        //     budgetLines[budgetLineBeingEdited].status === BLI_STATUS.PLANNED ||
        //     budgetLines[budgetLineBeingEdited].status === BLI_STATUS.EXECUTING;

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
        setTempBudgetLines(tempBudgetLines.map((item, index) => (index === budgetLineBeingEdited ? payload : item)));
        // const { id, data } = cleanBudgetLineItemForApi(payload);
        // TODO: Batch update BLIs
        // if (financialSnapshotChanged && BLIStatusIsPlannedOrExecuting) {
        //     setShowModal(true);
        //     setModalProps({
        //         heading: `Agreement edits that impact the budget will need Division Director approval. Do you want to send it for approval?`,
        //         actionButtonText: "Send to Approval",
        //         secondaryButtonText: "Continue Editing",
        //         handleConfirm: () => {
        //             updateBudgetLineItem({ id, data })
        //                 .unwrap()
        //                 .then((fulfilled) => {
        //                     console.log("Updated BLI:", fulfilled);
        //                 })
        //                 .catch((rejected) => {
        //                     console.error("Error Updating Budget Line");
        //                     console.error({ rejected });
        //                     setAlert({
        //                         type: "error",
        //                         heading: "Error",
        //                         message: "An error occurred. Please try again.",
        //                         navigateUrl: "/error"
        //                     });
        //                 });
        //             resetForm();
        //         }
        //     });

        //     return;
        // }

        // updateBudgetLineItem({ id, data })
        //     .unwrap()
        //     .then((fulfilled) => {
        //         console.log("Updated BLI:", fulfilled);
        //     })
        //     .catch((rejected) => {
        //         console.error("Error Updating Budget Line");
        //         console.error({ rejected });
        //         setAlert({
        //             type: "error",
        //             heading: "Error",
        //             message: "An error occurred. Please try again.",
        //             navigateUrl: "/error"
        //         });
        //     });
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

    const handleDeleteBudgetLine = (budgetLineId) => {
        const budgetLine = tempBudgetLines.find((bl) => bl.id === budgetLineId);

        setShowModal(true);
        setModalProps({
            heading: `Are you sure you want to delete budget line ${BLILabel(budgetLine)}?`,
            actionButtonText: "Delete",
            handleConfirm: () => {
                setTempBudgetLines(tempBudgetLines.filter((bl) => bl.id !== budgetLineId));
                setAlert({
                    type: "success",
                    heading: "Budget Line Deleted",
                    message: `Budget line ${BLILabel(budgetLine)} has been successfully deleted.`
                });
                resetForm();
            }
        });
        return;
        // TODO: Batch delete BLIs
        // setShowModal(true);
        // setModalProps({
        //     heading: `Are you sure you want to delete budget line ${BLILabel(budgetLine)}?`,
        //     actionButtonText: "Delete",
        //     handleConfirm: () => {
        //         deleteBudgetLineItem(budgetLineId)
        //             .unwrap()
        //             .then((fulfilled) => {
        //                 console.log("Deleted BLI:", fulfilled);
        //                 setAlert({
        //                     type: "success",
        //                     heading: "Budget Line Deleted",
        //                     message: `Budget line ${BLILabel(budgetLine)} has been successfully deleted.`
        //                 });
        //             })
        //             .catch((rejected) => {
        //                 console.error("Error Deleting Budget Line");
        //                 console.error({ rejected });
        //                 setAlert({
        //                     type: "error",
        //                     heading: "Error",
        //                     message: "An error occurred. Please try again.",
        //                     navigateUrl: "/error"
        //                 });
        //             });
        //         resetForm();
        //     }
        // });
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
        delete cleanData.has_active_workflow;

        return { id: budgetLineId, data: cleanData };
    };

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
        }
    };

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
            id: crypto.randomUUID(),
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
        // const { data } = cleanBudgetLineItemForApi(payload);
        // addBudgetLineItem(data)
        //     .unwrap()
        //     .then((fulfilled) => {
        //         console.log("Duplicated BLI:", fulfilled);
        //     })
        //     .catch((rejected) => {
        //         console.error("Error Duplicating Budget Line");
        //         console.error({ rejected });
        //         setAlert({
        //             type: "error",
        //             heading: "Error",
        //             message: "An error occurred. Please try again.",
        //             navigateUrl: "/error"
        //         });
        //     });
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
            goBack();
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

    React.useEffect(() => {
        if (budgetLineIdFromUrl) {
            setIsEditMode(true);
            const budgetLineFromUrl = budgetLines.find((budgetLine) => budgetLine.id === +budgetLineIdFromUrl);
            if (budgetLineFromUrl) {
                handleSetBudgetLineForEditingById(budgetLineFromUrl?.id);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [budgetLineIdFromUrl, budgetLines]);

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
        tempBudgetLines
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
