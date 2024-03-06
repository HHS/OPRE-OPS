import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { useBudgetLines, useBudgetLinesDispatch, useSetState } from "./context";
import useAlert from "../../../../hooks/use-alert.hooks";
import { useUpdateBudgetLineItemMutation, useAddBudgetLineItemMutation } from "../../../../api/opsAPI";
import { useGetLoggedInUserFullName } from "../../../../hooks/user.hooks";
import suite from "./suite";
import { budgetLinesTotal } from "../../../../helpers/budgetLines.helpers";
import { getProcurementShopSubTotal } from "../../../../helpers/agreement.helpers";
import { useDeleteAgreementMutation } from "../../../../api/opsAPI";

/**
 * Custom hook to manage the creation and manipulation of Budget Line Items and Service Components.
 *
 * @param {boolean} isReviewMode - Flag to indicate if the component is in review mode.
 * @param {Array<Object>} existingBudgetLines - Array of existing budget lines.
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
    isReviewMode,
    existingBudgetLines,
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
    const searchParams = new URLSearchParams(location.search);
    const [budgetLineIdFromUrl, setBudgetLineIdFromUrl] = React.useState(
        () => searchParams.get("budget-line-id") || null
    );
    const [deleteAgreement] = useDeleteAgreementMutation();

    const {
        selected_can: selectedCan,
        services_component_id: servicesComponentId,
        entered_amount: enteredAmount,
        entered_month: enteredMonth,
        entered_day: enteredDay,
        entered_year: enteredYear,
        entered_comments: enteredComments,
        is_editing_budget_line: isEditing,
        budget_line_being_edited: budgetLineBeingEdited,
        new_budget_lines: newBudgetLines
    } = useBudgetLines() || {
        selected_can: null,
        services_component_id: -1,
        entered_amount: null,
        entered_month: null,
        entered_day: null,
        entered_year: null,
        entered_comments: null,
        is_editing_budget_line: null,
        budget_line_being_edited: null,
        new_budget_lines: []
    };
    const dispatch = useBudgetLinesDispatch();
    const navigate = useNavigate();
    const [updateBudgetLineItem] = useUpdateBudgetLineItemMutation();
    const [addBudgetLineItem] = useAddBudgetLineItemMutation();
    const loggedInUserFullName = useGetLoggedInUserFullName();
    const { setAlert } = useAlert();
    // setters
    const setServicesComponentId = useSetState("services_component_id");
    const setSelectedCan = useSetState("selected_can");
    const setEnteredAmount = useSetState("entered_amount");
    const setEnteredMonth = useSetState("entered_month");
    const setEnteredDay = useSetState("entered_day");
    const setEnteredYear = useSetState("entered_year");
    const setEnteredComments = useSetState("entered_comments");
    const feesForCards = getProcurementShopSubTotal(selectedAgreement, newBudgetLines);
    const subTotalForCards = budgetLinesTotal(newBudgetLines);
    const totalsForCards = subTotalForCards + getProcurementShopSubTotal(selectedAgreement, newBudgetLines);

    // Validation
    let res = suite.get();
    const pageErrors = res.getErrors();

    if (isReviewMode) {
        suite({
            new_budget_lines: newBudgetLines
        });
    }
    const budgetLinePageErrors = Object.entries(pageErrors).filter((error) => error[0].includes("Budget line item"));
    const budgetLinePageErrorsExist = budgetLinePageErrors.length > 0;

    const handleSubmitForm = (e) => {
        e.preventDefault();
        dispatch({
            type: "ADD_BUDGET_LINE",
            payload: {
                id: crypto.getRandomValues(new Uint32Array(1))[0],
                line_description: ".",
                services_component_id: servicesComponentId,
                comments: enteredComments || "",
                can_id: selectedCan?.id || null,
                can: selectedCan || null,
                agreement_id: selectedAgreement?.id || null,
                amount: enteredAmount || 0,
                status: "DRAFT",
                date_needed: `${enteredYear}-${enteredMonth}-${enteredDay}` || null,
                proc_shop_fee_percentage: selectedProcurementShop?.fee || null
            }
        });
        dispatch({ type: "RESET_FORM" });
        setAlert({
            type: "success",
            heading: "Budget Line Added",
            message: "The budget line has been successfully added."
        });
    };

    const handleEditForm = (e) => {
        e.preventDefault();
        dispatch({
            type: "EDIT_BUDGET_LINE",
            payload: {
                id: newBudgetLines[budgetLineBeingEdited].id,
                line_description: ".",
                services_component_id: servicesComponentId,
                comments: enteredComments,
                can_id: selectedCan?.id,
                can: selectedCan,
                agreement_id: selectedAgreement?.id,
                amount: enteredAmount,
                date_needed:
                    enteredYear && enteredMonth && enteredDay ? `${enteredYear}-${enteredMonth}-${enteredDay}` : null,
                proc_shop_fee_percentage: selectedProcurementShop?.fee
            }
        });

        dispatch({ type: "RESET_FORM" });
        if (budgetLineIdFromUrl) {
            resetQueryParams();
        }
        setAlert({
            type: "success",
            heading: "Budget Line Updated",
            message: "The budget line has been successfully edited."
        });
    };

    const handleDeleteBudgetLine = (budgetLineId) => {
        setShowModal(true);
        setModalProps({
            heading: "Are you sure you want to delete this budget line?",
            actionButtonText: "Delete",
            handleConfirm: () => {
                dispatch({
                    type: "DELETE_BUDGET_LINE",
                    id: budgetLineId
                });
                dispatch({ type: "RESET_FORM" });
                setAlert({
                    type: "success",
                    heading: "Budget Line Deleted",
                    message: "The budget line has been successfully deleted."
                });
                setModalProps({});
            }
        });
    };

    const cleanBudgetLineItemForApi = (data) => {
        const cleanData = { ...data };
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

    const saveBudgetLineItems = async (event) => {
        event.preventDefault();

        const mutateBudgetLineItems = async (method, items) => {
            if (items.length === 0) {
                return;
            }
            if (method === "POST") {
                return Promise.all(
                    items.map((item) => {
                        // eslint-disable-next-line no-unused-vars
                        const { id, data } = cleanBudgetLineItemForApi(item);
                        addBudgetLineItem(data)
                            .unwrap()
                            .then((fulfilled) => {
                                console.log("Created New BLIs:", fulfilled);
                            })
                            .catch((rejected) => {
                                console.error("Error Creating Budget Lines");
                                console.error({ rejected });
                                setAlert({
                                    type: "error",
                                    heading: "Error",
                                    message: "An error occurred. Please try again.",
                                    navigateUrl: "/error"
                                });
                            });
                    })
                );
            }
            if (method === "PATCH") {
                return Promise.all(
                    items.map((item) => {
                        const { id, data } = cleanBudgetLineItemForApi(item);
                        updateBudgetLineItem({ id, data })
                            .unwrap()
                            .then((fulfilled) => {
                                console.log("Updated BLIs:", fulfilled);
                            })
                            .catch((rejected) => {
                                console.error("Error Updating Budget Lines");
                                console.error({ rejected });
                                setAlert({
                                    type: "error",
                                    heading: "Error",
                                    message: "An error occurred. Please try again.",
                                    navigateUrl: "/error"
                                });
                            });
                    })
                );
            }
        };

        const newBudgetLineItems = newBudgetLines.filter((budgetLineItem) => !("created_on" in budgetLineItem));
        const existingBudgetLineItems = newBudgetLines.filter((budgetLineItem) => "created_on" in budgetLineItem);

        if (newBudgetLineItems.length > 0) {
            mutateBudgetLineItems("POST", newBudgetLineItems);
        }
        if (existingBudgetLineItems.length > 0) {
            mutateBudgetLineItems("PATCH", existingBudgetLineItems);
        }
        // cleanup
        dispatch({ type: "RESET_FORM" });
        setIsEditMode(false);

        // handle next step
        if (isReviewMode) {
            navigate(`/agreements/review/${selectedAgreement.id}`);
        } else if (continueOverRide) {
            continueOverRide();
        } else if (goToNext) {
            goToNext();
        } else {
            navigate(-1); // go back
        }
    };

    const handleResetForm = () => dispatch({ type: "RESET_FORM" });

    const handleSetBudgetLineForEditing = (budgetLine) => {
        dispatch({ type: "SET_BUDGET_LINE_FOR_EDITING", payload: budgetLine });
    };

    const handleDuplicateBudgetLine = (budgetLine) => {
        dispatch({
            type: "DUPLICATE_BUDGET_LINE",
            payload: { ...budgetLine, created_by: loggedInUserFullName }
        });
    };

    const handleCancel = () => {
        setShowModal(true);
        setModalProps({
            heading: "Are you sure you want to cancel? Your agreement will not be saved.",
            actionButtonText: "Cancel",
            secondaryButtonText: "Continue Editing",
            handleConfirm: () => {
                deleteAgreement(selectedAgreement?.id)
                    .unwrap()
                    .then((fulfilled) => {
                        console.log(`DELETE agreement success: ${JSON.stringify(fulfilled, null, 2)}`);
                        setAlert({
                            type: "success",
                            heading: "Agreement cancelled",
                            message: `Agreement ${selectedAgreement?.name} has been successfully cancelled.`,
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

    // combine arrays of new budget lines and existing budget lines added
    // only run once on page load if there are existing budget lines
    React.useEffect(() => {
        if (existingBudgetLines.length > 0) {
            dispatch({ type: "ADD_EXISTING_BUDGET_LINES", payload: existingBudgetLines });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [existingBudgetLines]);

    // check budget line id from context and if found, set edit mode to true and set budget line for editing
    React.useEffect(() => {
        if (budgetLineIdFromUrl) {
            setIsEditMode(true);
            const budgetLineFromUrl = newBudgetLines.find((budgetLine) => budgetLine.id === +budgetLineIdFromUrl);
            if (budgetLineFromUrl) {
                handleSetBudgetLineForEditing(budgetLineFromUrl);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [budgetLineIdFromUrl, newBudgetLines]);

    const groupedBudgetLinesByServicesComponent = newBudgetLines
        .reduce((acc, budgetLine) => {
            const servicesComponentId = budgetLine.services_component_id;
            const index = acc.findIndex((item) => item.servicesComponentId === servicesComponentId);
            if (index === -1) {
                acc.push({ servicesComponentId, budgetLines: [budgetLine] });
            } else {
                acc[index].budgetLines.push(budgetLine);
            }
            return acc;
        }, [])
        .sort((a, b) => {
            if (a.servicesComponentId === null) return 1;
            if (b.servicesComponentId === null) return -1;
            return a.servicesComponentId - b.servicesComponentId;
        });

    return {
        handleSubmitForm,
        handleEditForm,
        handleDeleteBudgetLine,
        handleResetForm,
        handleSetBudgetLineForEditing,
        handleDuplicateBudgetLine,
        saveBudgetLineItems,
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
        setEnteredMonth,
        setEnteredDay,
        setEnteredYear,
        setEnteredComments,
        resetQueryParams,
        selectedCan,
        enteredAmount,
        enteredMonth,
        enteredDay,
        enteredYear,
        enteredComments,
        servicesComponentId,
        newBudgetLines,
        groupedBudgetLinesByServicesComponent,
        res,
        feesForCards,
        subTotalForCards,
        totalsForCards,
        handleCancel,
        handleGoBack
    };
};

useCreateBLIsAndSCs.propTypes = {
    isReviewMode: PropTypes.bool,
    existingBudgetLines: PropTypes.array,
    goToNext: PropTypes.func,
    goBack: PropTypes.func,
    continueOverRide: PropTypes.func,
    selectedAgreement: PropTypes.object,
    selectedProcurementShop: PropTypes.object,
    setIsEditMode: PropTypes.func,
    workflow: PropTypes.string
};

export default useCreateBLIsAndSCs;
