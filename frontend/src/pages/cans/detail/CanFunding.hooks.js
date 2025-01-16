import React from "react";
import {
    useAddCanFundingBudgetsMutation,
    useUpdateCanFundingBudgetMutation,
    useAddCanFundingReceivedMutation,
    useUpdateCanFundingReceivedMutation
} from "../../../api/opsAPI.js";
import { getCurrentFiscalYear } from "../../../helpers/utils.js";
import useAlert from "../../../hooks/use-alert.hooks";
import suite from "./CanFundingSuite.js";
import classnames from "vest/classnames";
import { NO_DATA } from "../../../constants.js";
import { useSelector } from "react-redux";
import cryptoRandomString from "crypto-random-string";

/**
 * @typedef {import("../../../components/CANs/CANTypes").FundingReceived} FundingReceived
 */

/**
 * @description - Custom hook for the CAN Funding component.
 * @param {number} canId
 * @param {string} canNumber
 * @param {string} totalFunding
 * @param {number} fiscalYear
 * @param {boolean} isBudgetTeamMember
 * @param {boolean} isEditMode
 * @param {() => void} toggleEditMode
 * @param {string} receivedFunding
 * @param {FundingReceived[]} fundingReceived
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
    receivedFunding,
    fundingReceived,
    currentFiscalYearFundingId
) {
    const currentFiscalYear = getCurrentFiscalYear();
    const showButton = isBudgetTeamMember && fiscalYear === Number(currentFiscalYear) && !isEditMode;
    const [showModal, setShowModal] = React.useState(false);
    const [totalReceived, setTotalReceived] = React.useState(parseFloat(receivedFunding || "0"));
    const [enteredFundingReceived, setEnteredFundingReceived] = React.useState([...fundingReceived]);
    const [deletedFundingReceivedIds, setDeletedFundingReceivedIds] = React.useState([]);
    const [modalProps, setModalProps] = React.useState({
        heading: "",
        actionButtonText: "",
        secondaryButtonText: "",
        handleConfirm: () => {}
    });

    const [budgetForm, setBudgetForm] = React.useState({
        enteredAmount: "",
        submittedAmount: "",
        isSubmitted: false
    });

    const initialFundingReceivedForm = {
        enteredAmount: "",
        submittedAmount: "",
        enteredNotes: "",
        submittedNotes: "",
        isSubmitted: false,
        isEditing: false,
        id: null,
        tempId: null
    };

    const [fundingReceivedForm, setFundingReceivedForm] = React.useState(initialFundingReceivedForm);

    const [addCanFundingBudget] = useAddCanFundingBudgetsMutation();
    const [updateCanFundingBudget] = useUpdateCanFundingBudgetMutation();
    const [addCanFundingReceived] = useAddCanFundingReceivedMutation();
    const [updateCanFundingReceived] = useUpdateCanFundingReceivedMutation();
    const { setAlert } = useAlert();
    const activeUserFullName = useSelector((state) => state.auth?.activeUser?.full_name) || "";

    React.useEffect(() => {
        setBudgetForm({ ...budgetForm, submittedAmount: totalFunding });
    }, [totalFunding]);

    React.useEffect(() => {
        setEnteredFundingReceived([...fundingReceived]);
    }, [fundingReceived]);

    const handleEnteredBudgetAmount = (value) => {
        const nextForm = {
            ...budgetForm,
            enteredAmount: value
        };
        setBudgetForm(nextForm);
    };

    const handleEnteredFundingReceivedAmount = (value) => {
        const nextForm = {
            ...fundingReceivedForm,
            enteredAmount: value
        };
        setFundingReceivedForm(nextForm);
    };

    const handleEnteredNotes = (value) => {
        const nextForm = {
            ...fundingReceivedForm,
            enteredNotes: value
        };
        setFundingReceivedForm(nextForm);
    };

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
            budget: budgetForm.submittedAmount
        };

        const handleFundingBudget = async () => {
            if (+payload.budget > 0) {
                if (currentFiscalYearFundingId) {
                    // PATCH for existing CAN Funding
                    await updateCanFundingBudget({
                        id: currentFiscalYearFundingId,
                        data: payload
                    }).unwrap();
                    console.log("CAN Funding Updated");
                } else {
                    // POST for new CAN Funding
                    await addCanFundingBudget({
                        data: payload
                    }).unwrap();
                    console.log("CAN Funding Added");
                }
            }
        };

        const handleFundingReceived = async () => {
            const fundingPromise = [];
            enteredFundingReceived.map((fundingItem) => {
                //POST
                if (fundingItem.id === NO_DATA && "tempId" in fundingItem) {
                    fundingPromise.push(
                        addCanFundingReceived({
                            data: {
                                fiscal_year: fiscalYear,
                                can_id: canId,
                                funding: fundingItem.funding,
                                notes: fundingItem.notes
                            }
                        })
                    );
                } else if (fundingItem.id !== NO_DATA && "tempId" in fundingItem) {
                    //PATCH
                    fundingPromise.push(
                        updateCanFundingReceived({
                            id: fundingItem.id,
                            data: {
                                fiscal_year: fiscalYear,
                                can_id: canId,
                                funding: fundingItem.funding,
                                notes: fundingItem.notes
                            }
                        })
                    );
                }
            });
            await Promise.all(fundingPromise);
        };

        try {
            handleFundingBudget();
            handleFundingReceived();

            setAlert({
                type: "success",
                heading: "CAN Funding Updated",
                message: `The CAN ${canNumber} has been successfully updated.`
            });
        } catch (error) {
            console.error("Error Updating CAN", error);
            setAlert({
                type: "error",
                heading: "Error",
                message: "An error occurred while updating the CAN.",
                redirectUrl: "/error"
            });
        }

        cleanUp();
    };

    const handleAddBudget = (e) => {
        e.preventDefault();

        const nextForm = {
            ...budgetForm,
            enteredAmount: "",
            submittedAmount: budgetForm.enteredAmount,
            isSubmitted: true
        };
        setBudgetForm(nextForm);
    };

    const handleAddFundingReceived = (e) => {
        e.preventDefault();

        // Update total received first using the functional update pattern

        // update the table data
        const isRealId = fundingReceivedForm.id && fundingReceivedForm.id !== NO_DATA;
        let newFundingReceived = {
            id: fundingReceivedForm.id ?? NO_DATA,
            tempId: fundingReceivedForm.tempId ?? `temp-${cryptoRandomString({ length: 3 })}`,
            created_on: new Date().toISOString(),
            created_by_user: {
                full_name: activeUserFullName
            },
            notes: fundingReceivedForm.enteredNotes,
            funding: +fundingReceivedForm.enteredAmount,
            fiscal_year: fiscalYear
        };

        // Check if we are editing an existing funding received
        if (fundingReceivedForm.isEditing) {
            editFundingReceived(newFundingReceived);
        } else {
            // Add the new funding received
            setTotalReceived((currentTotal) => currentTotal + +fundingReceivedForm.enteredAmount);
            setEnteredFundingReceived([...enteredFundingReceived, newFundingReceived]);
        }

        // Then update the form state
        const nextForm = {
            ...fundingReceivedForm,
            enteredAmount: "",
            submittedAmount: fundingReceivedForm.enteredAmount,
            enteredNotes: "",
            submittedNotes: fundingReceivedForm.enteredNotes,
            isSubmitted: true,
            isEditing: false,
            id: null,
            tempId: null
        };
        setFundingReceivedForm(nextForm);
    };

    const editFundingReceived = (newFundingReceived) => {
        // Overwrite the existing funding received in enteredFundingReceived with the new data
        const matchingFundingReceived = enteredFundingReceived.find((fundingEntry) => {
            if (newFundingReceived.id === NO_DATA) {
                //new funding received
                return fundingEntry.tempId === newFundingReceived.tempId;
            }
            return fundingEntry.id.toString() === newFundingReceived.id.toString(); // TODO: can we update the id type from number to string, then no need to convert?
        });

        const matchingFundingReceivedFunding = +matchingFundingReceived?.funding || 0;
        setTotalReceived(
            (currentTotal) => currentTotal - matchingFundingReceivedFunding + +fundingReceivedForm.enteredAmount
        );

        const updatedFundingReceived = enteredFundingReceived.map((fundingEntry) => {
            if (fundingEntry.id.toString() === NO_DATA) {
                return fundingEntry.tempId === newFundingReceived.tempId
                    ? { ...matchingFundingReceived, ...newFundingReceived }
                    : fundingEntry;
            } else {
                return fundingEntry.id.toString() === newFundingReceived.id.toString()
                    ? { ...matchingFundingReceived, ...newFundingReceived }
                    : fundingEntry;
            }
        });
        setEnteredFundingReceived(updatedFundingReceived);
    };

    const cancelFundingReceived = (e) => {
        e.preventDefault();
        setFundingReceivedForm(initialFundingReceivedForm);
    };

    const deleteFundingReceived = (fundingReceivedId) => {
        const matchingFundingReceived = enteredFundingReceived.find((fundingItem) => {
            if (fundingItem.id === NO_DATA) {
                return fundingItem.tempId === fundingReceivedId;
            }
            return fundingItem.id === fundingReceivedId;
        });

        const newEnteredFundingReceived = enteredFundingReceived.filter((fundingItem) => {
            const shouldNotDelete =
                fundingItem.id === NO_DATA
                    ? fundingItem.tempId !== matchingFundingReceived.tempId
                    : fundingItem.id !== matchingFundingReceived.id;
            return shouldNotDelete;
        });

        setEnteredFundingReceived(newEnteredFundingReceived);

        if (matchingFundingReceived.id !== NO_DATA) {
            const newDeletedFundingReceivedIds = [...deletedFundingReceivedIds, fundingReceivedId]
            setDeletedFundingReceivedIds(newDeletedFundingReceivedIds);
        }
    };

    const handleCancel = () => {
        setShowModal(true);
        setModalProps({
            heading: "Are you sure you want to cancel editing? Your changes will not be saved.",
            actionButtonText: "Cancel Edits",
            secondaryButtonText: "Continue Editing",
            handleConfirm: () => {
                setTotalReceived(parseFloat(receivedFunding || "0"));
                cleanUp();
            }
        });
    };

    const cleanUp = () => {
        setEnteredFundingReceived([...fundingReceived]);
        setBudgetForm({ enteredAmount: "", submittedAmount: totalFunding, isSubmitted: false });
        setShowModal(false);
        const nextForm = { ...fundingReceivedForm, enteredAmount: "", enteredNotes: "" };
        setFundingReceivedForm(nextForm);
        toggleEditMode();
        setModalProps({
            heading: "",
            actionButtonText: "",
            secondaryButtonText: "",
            handleConfirm: () => {}
        });
        suite.reset();
    };

    const runValidate = (name, value) => {
        suite({ remainingAmount: +budgetForm.submittedAmount - totalReceived, ...{ [name]: value } }, name);
    };

    const populateFundingReceivedForm = (fundingReceivedId) => {
        let matchingFundingReceived;
        if (fundingReceivedId.toString().includes("temp")) {
            matchingFundingReceived = enteredFundingReceived.find((f) => f.tempId === fundingReceivedId);
        } else {
            matchingFundingReceived = enteredFundingReceived.find((f) => f.id === fundingReceivedId);
        }

        const { funding, notes } = matchingFundingReceived;
        const nextForm = {
            enteredAmount: funding,
            enteredNotes: notes,
            isEditing: true,
            id: fundingReceivedId.toString().includes("temp") ? NO_DATA : fundingReceivedId,
            tempId: matchingFundingReceived?.tempId
        };

        setFundingReceivedForm(nextForm);
    };

    return {
        handleAddBudget,
        handleAddFundingReceived,
        handleCancel,
        handleSubmit,
        modalProps,
        runValidate,
        res,
        cn,
        setShowModal,
        showButton,
        showModal,
        budgetForm,
        handleEnteredBudgetAmount,
        fundingReceivedForm,
        handleEnteredFundingReceivedAmount,
        handleEnteredNotes,
        totalReceived,
        enteredFundingReceived,
        populateFundingReceivedForm,
        cancelFundingReceived,
        deleteFundingReceived
    };
}
