import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import useAlert from "../../../../hooks/use-alert.hooks";
import {
    useUpdateBudgetLineItemMutation,
    useAddBudgetLineItemMutation,
    useDeleteAgreementMutation,
    useGetAgreementByIdQuery
} from "../../../../api/opsAPI";
import { useGetLoggedInUserFullName } from "../../../../hooks/user.hooks";
import suite from "./suite";
import { budgetLinesTotal } from "../../../../helpers/budgetLines.helpers";
import { getProcurementShopSubTotal } from "../../../../helpers/agreement.helpers";

/**
 * Custom hook to manage the creation and manipulation of Budget Line Items and Service Components.
 *
 * @param {boolean} isReviewMode - Flag to indicate if the component is in review mode.
 * @param {Array<Object>} budgetLines - Array of budget lines.
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
    const [enteredMonth, setEnteredMonth] = React.useState(null);
    const [enteredDay, setEnteredDay] = React.useState(null);
    const [enteredYear, setEnteredYear] = React.useState(null);
    const [enteredComments, setEnteredComments] = React.useState(null);
    const [isEditing, setIsEditing] = React.useState(false);
    const [budgetLineBeingEdited, setBudgetLineBeingEdited] = React.useState(null);
    const searchParams = new URLSearchParams(location.search);
    const [budgetLineIdFromUrl, setBudgetLineIdFromUrl] = React.useState(
        () => searchParams.get("budget-line-id") || null
    );
    const [deleteAgreement] = useDeleteAgreementMutation();
    const navigate = useNavigate();
    const [updateBudgetLineItem] = useUpdateBudgetLineItemMutation();
    const [addBudgetLineItem] = useAddBudgetLineItemMutation();
    const loggedInUserFullName = useGetLoggedInUserFullName();
    const { setAlert } = useAlert();
    const feesForCards = getProcurementShopSubTotal(selectedAgreement, budgetLines);
    const subTotalForCards = budgetLinesTotal(budgetLines);
    const totalsForCards = subTotalForCards + getProcurementShopSubTotal(selectedAgreement, budgetLines);

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

    const handleAddBLI = (e) => {
        e.preventDefault();
        const payload = {
            services_component_id: servicesComponentId,
            comments: enteredComments || "",
            can_id: selectedCan?.id || null,
            can: selectedCan || null,
            agreement_id: selectedAgreement?.id || null,
            amount: enteredAmount || 0,
            status: "DRAFT",
            date_needed:
                enteredYear && enteredMonth && enteredDay ? `${enteredYear}-${enteredMonth}-${enteredDay}` : null,
            proc_shop_fee_percentage: selectedProcurementShop?.fee || null
        };
        const { data } = cleanBudgetLineItemForApi(payload);
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
        resetForm();
        setAlert({
            type: "success",
            heading: "Budget Line Added",
            message: "The budget line has been successfully added."
        });
    };

    const handleEditBLI = (e) => {
        e.preventDefault();

        const payload = {
            id: budgetLines[budgetLineBeingEdited].id,
            services_component_id: servicesComponentId,
            comments: enteredComments,
            can_id: selectedCan?.id,
            can: selectedCan,
            agreement_id: selectedAgreement?.id,
            amount: enteredAmount,
            date_needed:
                enteredYear && enteredMonth && enteredDay ? `${enteredYear}-${enteredMonth}-${enteredDay}` : null,
            proc_shop_fee_percentage: selectedProcurementShop?.fee
        };
        const { id, data } = cleanBudgetLineItemForApi(payload);
        updateBudgetLineItem({ id, data })
            .unwrap()
            .then((fulfilled) => {
                console.log("Updated BLI:", fulfilled);
            })
            .catch((rejected) => {
                console.error("Error Updating Budget Line");
                console.error({ rejected });
                setAlert({
                    type: "error",
                    heading: "Error",
                    message: "An error occurred. Please try again.",
                    navigateUrl: "/error"
                });
            });
        resetForm();
        if (budgetLineIdFromUrl) {
            resetQueryParams();
        }
        setAlert({
            type: "success",
            heading: "Budget Line Updated",
            message: "The budget line has been successfully edited."
        });
    };

    // TODO: Refactor to use new api call not yet implemented
    const handleDeleteBudgetLine = () => {
        alert("Not yet implemented");
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

    const handleSetBudgetLineForEditingById = (budgetLineId) => {
        const index = budgetLines.findIndex((budgetLine) => budgetLine.id === budgetLineId);
        if (index !== -1) {
            const { services_component_id, comments, can, amount, date_needed } = budgetLines[index];
            let entered_year = "";
            let entered_month = "";
            let entered_day = "";

            if (date_needed) {
                [entered_year, entered_month, entered_day] = date_needed.split("-").map((d) => parseInt(d, 10));
            }

            setServicesComponentId(services_component_id);
            setSelectedCan(can);
            setEnteredAmount(amount);
            setEnteredMonth(entered_month);
            setEnteredDay(entered_day);
            setEnteredYear(entered_year);
            setEnteredComments(comments);
            setIsEditing(true);
            setBudgetLineBeingEdited(index);
        }
    };

    const handleDuplicateBudgetLine = (budgetLineId) => {
        const budgetLine = budgetLines.find((bl) => bl.id === budgetLineId);
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
            services_component_id,
            comments,
            can_id,
            can,
            agreement_id,
            amount,
            date_needed,
            proc_shop_fee_percentage,
            status: "DRAFT",
            created_by: loggedInUserFullName
        };
        const { data } = cleanBudgetLineItemForApi(payload);
        addBudgetLineItem(data)
            .unwrap()
            .then((fulfilled) => {
                console.log("Duplicated BLI:", fulfilled);
            })
            .catch((rejected) => {
                console.error("Error Duplicating Budget Line");
                console.error({ rejected });
                setAlert({
                    type: "error",
                    heading: "Error",
                    message: "An error occurred. Please try again.",
                    navigateUrl: "/error"
                });
            });
        resetForm();
    };

    const handleCancel = () => {
        setShowModal(true);
        setModalProps({
            heading: "Are you sure you want to cancel creating a new agreement? Your progress will not be saved.",
            actionButtonText: "Cancel Agreement",
            secondaryButtonText: "Continue Editing",
            handleConfirm: () => {
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
        setEnteredMonth(null);
        setEnteredDay(null);
        setEnteredYear(null);
        setEnteredComments(null);
    };

    React.useEffect(() => {
        if (budgetLineIdFromUrl) {
            setIsEditMode(true);
            const budgetLineFromUrl = budgetLines.find((budgetLine) => budgetLine.id === +budgetLineIdFromUrl);
            if (budgetLineFromUrl) {
                handleSetBudgetLineForEditingById(budgetLineFromUrl);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [budgetLineIdFromUrl, budgetLines]);

    const groupedBudgetLinesByServicesComponent = budgetLines
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
        budgetLines,
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
