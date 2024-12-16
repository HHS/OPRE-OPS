import React from "react";
import { useAddCanFundingBudgetsMutation, useUpdateCanFundingBudgetMutation } from "../../../api/opsAPI.js";
import { getCurrentFiscalYear } from "../../../helpers/utils.js";
import useAlert from "../../../hooks/use-alert.hooks";
import suite from "../../../components/CANs/CANBudgetForm/suite.js";

/**
 * @param {number} canId
 * @param {string} canNumber
 * @param {number} [currentFiscalYearFundingId] - The id of the current fiscal year funding. optional
 * @param {string} totalFunding
 * @param {number} fiscalYear
 * @param {boolean} isBudgetTeamMember
 * @param {boolean} isEditMode
 * @param {() => void} toggleEditMode
 */
export default function useCanFunding(
    canId,
    canNumber,
    currentFiscalYearFundingId,
    totalFunding,
    fiscalYear,
    isBudgetTeamMember,
    isEditMode,
    toggleEditMode
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
        setBudgetAmount,
        setShowModal,
        showButton,
        showModal,
        submittedAmount
    };
}
