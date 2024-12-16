import React from "react";
import { useAddCanFundingBudgetsMutation, useUpdateCanFundingBudgetMutation } from "../../../api/opsAPI.js";
import { getCurrentFiscalYear } from "../../../helpers/utils.js";
import useAlert from "../../../hooks/use-alert.hooks";
import suite from "../../../components/CANs/CANBudgetForm/suite.js";
import classnames from "vest/classnames";

/**
 * @description - Custom hook for the CAN Funding component.
 * @param {number} canId
 * @param {string} canNumber
 * @param {string} totalFunding
 * @param {number} fiscalYear
 * @param {boolean} isBudgetTeamMember
 * @param {boolean} isEditMode
 * @param {() => void} toggleEditMode
 * @param {number} [currentFiscalYearFundingId] - The id of the current fiscal year funding. optional
 */
export default function useCanFunding(
    canId,
    canNumber,
    totalFunding,
    fiscalYear,
    isBudgetTeamMember,
    isEditMode,
    toggleEditMode,
    currentFiscalYearFundingId
) {
    const currentFiscalYear = getCurrentFiscalYear();
    const showButton = isBudgetTeamMember && fiscalYear === Number(currentFiscalYear) && !isEditMode;
    const [budgetAmount, setBudgetAmount] = React.useState("");
    const [submittedAmount, setSubmittedAmount] = React.useState("");
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({
        heading: "",
        actionButtonText: "",
        secondaryButtonText: "",
        handleConfirm: () => {}
    });

    const [addCanFundingBudget] = useAddCanFundingBudgetsMutation();
    const [updateCanFundingBudget] = useUpdateCanFundingBudgetMutation();
    const { setAlert } = useAlert();

    React.useEffect(() => {
        setSubmittedAmount(totalFunding);
    }, [totalFunding]);
    // Validation
    let res = suite.get();

    const cn = classnames(suite.get(), {
        invalid: "usa-form-group--error",
        valid: "success",
        warning: "warning"
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            fiscal_year: fiscalYear,
            can_id: canId,
            budget: submittedAmount
        };
        setAlert({
            type: "success",
            heading: "CAN Funding Updated",
            message: `The CAN ${canNumber} has been successfully updated.`
        });
        if (currentFiscalYearFundingId) {
            updateCanFundingBudget({
                id: currentFiscalYearFundingId,
                data: payload
            });
        } else {
            addCanFundingBudget({
                data: payload
            });
        }

        cleanUp();
    };

    const handleAddBudget = (e) => {
        e.preventDefault();
        setSubmittedAmount(budgetAmount);
    };

    const handleCancel = () => {
        setShowModal(true);
        setModalProps({
            heading: "Are you sure you want to cancel editing? Your changes will not be saved.",
            actionButtonText: "Cancel Edits",
            secondaryButtonText: "Continue Editing",
            handleConfirm: () => cleanUp()
        });
    };

    const cleanUp = () => {
        setBudgetAmount("");
        setSubmittedAmount(totalFunding);
        setShowModal(false);
        toggleEditMode();
        setModalProps({
            heading: "",
            actionButtonText: "",
            secondaryButtonText: "",
            handleConfirm: () => {}
        });
    };

    const runValidate = (name, value) => {
        suite(
            {
                ...{ [name]: value }
            },
            name
        );
    };

    return {
        budgetAmount,
        handleAddBudget,
        handleCancel,
        handleSubmit,
        modalProps,
        runValidate,
        res,
        cn,
        setBudgetAmount,
        setShowModal,
        showButton,
        showModal,
        submittedAmount
    };
}
