import React from "react";
import { getCurrentFiscalYear } from "../../../helpers/utils.js";

export default function useCanFunding(fiscalYear, isBudgetTeamMember, toggleEditMode) {
    const currentFiscalYear = getCurrentFiscalYear();
    const showButton = isBudgetTeamMember && fiscalYear === Number(currentFiscalYear);
    const [budgetAmount, setBudgetAmount] = React.useState(0);
    const [submittedAmount, setSubmittedAmount] = React.useState(0);
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({
        heading: "",
        actionButtonText: "",
        secondaryButtonText: "",
        handleConfirm: () => {}
    });

    const handleAddBudget = (e) => {
        e.preventDefault();
        setSubmittedAmount(budgetAmount);
    };

    const handleCancel = (e) => {
        e.preventDefault();
        setShowModal(true);
        setModalProps({
            heading: "Are you sure you want to cancel editing? Your changes will not be saved.",
            actionButtonText: "Cancel Edits",
            secondaryButtonText: "Continue Editing",
            handleConfirm: () => cleanUp()
        });
    };

    const cleanUp = () => {
        setBudgetAmount(0);
        setSubmittedAmount(0);
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
        modalProps,
        setBudgetAmount,
        setShowModal,
        showButton,
        showModal,
        submittedAmount
    };
}
