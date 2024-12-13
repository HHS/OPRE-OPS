import React from "react";
import { useAddCanFundingBudgetsMutation } from "../../../api/opsAPI.js";
import { getCurrentFiscalYear } from "../../../helpers/utils.js";
import useAlert from "../../../hooks/use-alert.hooks";

/**
 * @param {number} canId
 * @param {string} canNumber
 * @param {string} expectedFunding
 * @param {number} fiscalYear
 * @param {boolean} isBudgetTeamMember
 * @param {() => void} toggleEditMode
 */
export default function useCanFunding(
    canId,
    canNumber,
    expectedFunding,
    fiscalYear,
    isBudgetTeamMember,
    toggleEditMode
) {
    const currentFiscalYear = getCurrentFiscalYear();
    const showButton = isBudgetTeamMember && fiscalYear === Number(currentFiscalYear);
    const [budgetAmount, setBudgetAmount] = React.useState("");
    const [submittedAmount, setSubmittedAmount] = React.useState(expectedFunding);
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({
        heading: "",
        actionButtonText: "",
        secondaryButtonText: "",
        handleConfirm: () => {}
    });

    const [addCanFundingBudget] = useAddCanFundingBudgetsMutation();
    const { setAlert } = useAlert();

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
        addCanFundingBudget({
            data: payload
        });

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
        setSubmittedAmount(expectedFunding);
        setShowModal(false);
        toggleEditMode();
        setModalProps({
            heading: "",
            actionButtonText: "",
            secondaryButtonText: "",
            handleConfirm: () => {}
        });
    };

    return {
        budgetAmount,
        handleAddBudget,
        handleCancel,
        handleSubmit,
        modalProps,
        setBudgetAmount,
        setShowModal,
        showButton,
        showModal,
        submittedAmount
    };
}
