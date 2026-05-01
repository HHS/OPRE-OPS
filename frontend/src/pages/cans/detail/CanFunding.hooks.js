import cryptoRandomString from "crypto-random-string";
import React from "react";
import { useSelector } from "react-redux";
import { useBlocker } from "react-router-dom";
import classnames from "vest/classnames";
import {
    useAddCanFundingBudgetsMutation,
    useAddCanFundingReceivedMutation,
    useDeleteCanFundingReceivedMutation,
    useUpdateCanFundingBudgetMutation,
    useUpdateCanFundingReceivedMutation
} from "../../../api/opsAPI.js";
import { NO_DATA } from "../../../constants.js";
import { scrollToTop } from "../../../helpers/scrollToTop.helper.js";
import { getCurrentFiscalYear } from "../../../helpers/utils.js";
import useAlert from "../../../hooks/use-alert.hooks";
import suite from "./CanFundingSuite.js";

/**
 * @typedef {import("../../../types/CANTypes").FundingReceived} FundingReceived
 */

/**
 * @description - Custom hook for the CAN Funding component.
 * @param {number} canId
 * @param {string} canNumber
 * @param {number} totalFunding
 * @param {number} fiscalYear
 * @param {boolean} isBudgetTeamMember
 * @param {boolean} isEditMode
 * @param {() => void} toggleEditMode
 * @param {() => void} resetWelcomeModal
 * @param {number} receivedFunding
 * @param {FundingReceived[]} fundingReceived
 * @param {number} [currentFiscalYearFundingId] - The id of the current fiscal year funding. optional
 * @param {boolean} isExpired - is the CAN expired
 */
export default function useCanFunding(
    canId,
    canNumber,
    totalFunding,
    fiscalYear,
    isBudgetTeamMember,
    isEditMode,
    toggleEditMode,
    resetWelcomeModal,
    receivedFunding,
    fundingReceived,
    currentFiscalYearFundingId,
    isExpired
) {
    const currentFiscalYear = getCurrentFiscalYear();
    const showButton = isBudgetTeamMember && !isExpired && fiscalYear === Number(currentFiscalYear) && !isEditMode;
    const [showModal, setShowModal] = React.useState(false);
    const [totalReceived, setTotalReceived] = React.useState(receivedFunding || 0);
    const [enteredFundingReceived, setEnteredFundingReceived] = React.useState([...fundingReceived]);
    const [deletedFundingReceivedIds, setDeletedFundingReceivedIds] = React.useState([]);
    const [budgetEnteredAmount, setBudgetEnteredAmount] = React.useState(totalFunding);
    const [fundingReceivedEnteredAmount, setFundingReceivedEnteredAmount] = React.useState("");
    const [modalProps, setModalProps] = React.useState({
        heading: "",
        actionButtonText: "",
        secondaryButtonText: "",
        handleConfirm: () => {}
    });

    const [showBlockerModal, setShowBlockerModal] = React.useState(false);
    const [blockerModalProps, setBlockerModalProps] = React.useState({});
    const [isCancelling, setIsCancelling] = React.useState(false);

    const [budgetForm, setBudgetForm] = React.useState({
        submittedAmount: 0.0,
        isSubmitted: false
    });

    const initialFundingReceivedForm = {
        originalAmount: 0.0,
        submittedAmount: 0.0,
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
    const [deleteCanFundingReceived] = useDeleteCanFundingReceivedMutation();
    const { setAlert } = useAlert();
    const activeUserFullName =
        useSelector((state) => state.auth?.activeUser?.display_name ?? state.auth?.activeUser?.full_name) || "";

    React.useEffect(() => {
        setTotalReceived(receivedFunding);
    }, [receivedFunding]);

    React.useEffect(() => {
        setBudgetForm((b) => ({ ...b, submittedAmount: totalFunding }));
        setBudgetEnteredAmount(totalFunding);
    }, [totalFunding]);

    React.useEffect(() => {
        setEnteredFundingReceived([...fundingReceived]);
    }, [fundingReceived]);

    const hasChanged = React.useMemo(() => {
        const budgetChanged = +budgetEnteredAmount !== +totalFunding;
        const budgetSubmitted = budgetForm.isSubmitted;
        const fundingReceivedInProgress =
            fundingReceivedEnteredAmount !== "" || fundingReceivedForm.enteredNotes !== "";
        const hasNewFundingReceived = enteredFundingReceived.some((e) => "tempId" in e);
        const hasDeletedFunding = deletedFundingReceivedIds.length > 0;
        return (
            budgetChanged || budgetSubmitted || fundingReceivedInProgress || hasNewFundingReceived || hasDeletedFunding
        );
    }, [
        budgetEnteredAmount,
        totalFunding,
        budgetForm.isSubmitted,
        fundingReceivedEnteredAmount,
        fundingReceivedForm.enteredNotes,
        enteredFundingReceived,
        deletedFundingReceivedIds
    ]);

    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            !isCancelling && hasChanged && currentLocation.pathname !== nextLocation.pathname
    );

    /** @param {string} value */
    const handleEnteredBudgetAmount = (value) => {
        setBudgetEnteredAmount(+value);
    };

    /** @param {string} value */
    const handleEnteredFundingReceivedAmount = (value) => {
        setFundingReceivedEnteredAmount(value);
    };

    /** @param {string} value */
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

    const saveChanges = React.useCallback(async () => {
        const payload = {
            fiscal_year: fiscalYear,
            can_id: canId,
            budget: budgetForm.submittedAmount
        };

        const handleFundingBudget = async () => {
            if (+payload.budget >= 0) {
                if (currentFiscalYearFundingId) {
                    await updateCanFundingBudget({
                        id: currentFiscalYearFundingId,
                        data: payload
                    }).unwrap();
                    console.log("CAN Funding Updated");
                } else {
                    await addCanFundingBudget({
                        data: payload
                    }).unwrap();
                    console.log("CAN Funding Added");
                }
            }
        };

        const handleFundingReceived = async () => {
            /** @type {Promise<any>[]} */
            const fundingPromise = [];
            enteredFundingReceived.map((fundingItem) => {
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

        const handleDeleteFundingReceived = async () => {
            /** @type {Promise<any>[]} */
            const deletePromise = [];
            deletedFundingReceivedIds.map((id) => {
                deletePromise.push(deleteCanFundingReceived(id));
            });
            await Promise.all(deletePromise);
        };

        const operations = [
            { name: "handleFundingBudget", fn: handleFundingBudget },
            { name: "handleFundingReceived", fn: handleFundingReceived },
            { name: "handleDeleteFundingReceived", fn: handleDeleteFundingReceived }
        ];

        const results = await Promise.allSettled(operations.map((operation) => operation.fn()));
        const failures = results
            .map((result, index) =>
                result.status === "rejected" ? { operation: operations[index].name, reason: result.reason } : null
            )
            .filter(Boolean);

        if (failures.length > 0) {
            console.error("Failed CAN funding operations:", failures);
            throw failures[0].reason || new Error("CAN funding update failed");
        }

        setAlert({
            type: "success",
            heading: "CAN Updated",
            message: `The CAN ${canNumber} has been successfully updated.`
        });
    }, [
        fiscalYear,
        canId,
        canNumber,
        budgetForm.submittedAmount,
        currentFiscalYearFundingId,
        enteredFundingReceived,
        deletedFundingReceivedIds,
        updateCanFundingBudget,
        addCanFundingBudget,
        addCanFundingReceived,
        updateCanFundingReceived,
        deleteCanFundingReceived,
        setAlert
    ]);

    const saveChangesRef = React.useRef(saveChanges);
    React.useEffect(() => {
        saveChangesRef.current = saveChanges;
    }, [saveChanges]);

    const toggleEditModeRef = React.useRef(toggleEditMode);
    React.useEffect(() => {
        toggleEditModeRef.current = toggleEditMode;
    }, [toggleEditMode]);

    const resetWelcomeModalRef = React.useRef(resetWelcomeModal);
    React.useEffect(() => {
        resetWelcomeModalRef.current = resetWelcomeModal;
    }, [resetWelcomeModal]);

    const blockerRef = React.useRef(blocker);
    React.useEffect(() => {
        blockerRef.current = blocker;
    }, [blocker]);

    const proceedIfBlocked = async () => {
        const currentBlocker = blockerRef.current;
        if (!currentBlocker || currentBlocker.state !== "blocked") {
            return;
        }
        try {
            await currentBlocker.proceed();
        } catch (error) {
            const message = error && typeof error.message === "string" ? error.message.trim() : "";
            if (message.startsWith("Invalid blocker state transition")) {
                console.warn("Ignored known React Router blocker exception:", message);
                return;
            }
            throw error;
        }
    };

    React.useEffect(() => {
        if (blocker.state === "blocked") {
            setShowBlockerModal(true);
            setBlockerModalProps({
                heading: "You have unsaved changes",
                description: "Do you want to save your changes before leaving this page?",
                actionButtonText: "Save Changes",
                secondaryButtonText: "Leave without saving",
                handleConfirm: async () => {
                    try {
                        await saveChangesRef.current();
                        setShowBlockerModal(false);
                        toggleEditModeRef.current();
                        resetWelcomeModalRef.current();
                        await proceedIfBlocked();
                    } catch (error) {
                        console.error("Error saving CAN funding:", error);
                        setAlert({
                            type: "error",
                            heading: "Error",
                            message: "An error occurred while updating the CAN.",
                            redirectUrl: "/error"
                        });
                        blocker.reset();
                    }
                },
                handleSecondary: async () => {
                    setShowBlockerModal(false);
                    toggleEditModeRef.current();
                    resetWelcomeModalRef.current();
                    await proceedIfBlocked();
                },
                closeModal: () => {
                    setShowBlockerModal(false);
                    blocker.reset();
                }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [blocker.state]);

    /** @param {React.FormEvent<HTMLFormElement>} e */
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await saveChanges();
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

    /** @param {React.FormEvent<HTMLFormElement>} e */
    const handleAddBudget = (e) => {
        e.preventDefault();

        const nextForm = {
            ...budgetForm,
            submittedAmount: budgetEnteredAmount,
            isSubmitted: true
        };
        setBudgetForm(nextForm);
        setBudgetEnteredAmount("");
        setAlert({
            type: "success",
            heading: "FY Budget Updated",
            message: `The CAN ${canNumber} FY Budget has been successfully updated.`
        });
    };

    /** @param {React.FormEvent<HTMLFormElement>} e */
    const handleAddFundingReceived = (e) => {
        e.preventDefault();

        // Update total received first using the functional update pattern

        // update the table data
        let newFundingReceived = {
            id: fundingReceivedForm.id ?? NO_DATA,
            tempId: fundingReceivedForm.tempId ?? `temp-${cryptoRandomString({ length: 3 })}`,
            created_on: new Date().toISOString(),
            created_by_user: {
                full_name: activeUserFullName
            },
            notes: fundingReceivedForm.enteredNotes,
            funding: fundingReceivedEnteredAmount,
            fiscal_year: fiscalYear
        };

        // Check if we are editing an existing funding received
        if (fundingReceivedForm.isEditing) {
            editFundingReceived(newFundingReceived);
            setAlert({
                type: "success",
                heading: "Funding Received Updated",
                message: `The CAN ${canNumber} funding received has been successfully updated.`
            });
        } else {
            // Add the new funding received
            setTotalReceived((currentTotal) => currentTotal + +fundingReceivedEnteredAmount);
            setEnteredFundingReceived([...enteredFundingReceived, newFundingReceived]);
            setAlert({
                type: "success",
                heading: "Funding Received Added",
                message: `The CAN ${canNumber} funding received has been successfully added.`
            });
        }

        // Then update the form state
        const nextForm = {
            ...fundingReceivedForm,
            originalAmount: 0.0,
            submittedAmount: fundingReceivedEnteredAmount,
            enteredNotes: "",
            submittedNotes: fundingReceivedForm.enteredNotes,
            isSubmitted: true,
            isEditing: false,
            id: null,
            tempId: null
        };
        setFundingReceivedForm(nextForm);
        setFundingReceivedEnteredAmount("");
    };

    /** @param {FundingReceived} newFundingReceived */
    const editFundingReceived = (newFundingReceived) => {
        // Overwrite the existing funding received in enteredFundingReceived with the new data
        const matchingFundingReceived = enteredFundingReceived.find((fundingEntry) => {
            if (newFundingReceived.id === NO_DATA) {
                //new funding received
                return fundingEntry.tempId === newFundingReceived.tempId;
            }
            return fundingEntry.id === newFundingReceived.id;
        });

        const matchingFundingReceivedFunding =
            // set matchingFundingReceivedFunding to 0 if matchingFundingReceived is undefined
            matchingFundingReceived && matchingFundingReceived.funding ? +matchingFundingReceived.funding : 0;
        setTotalReceived(
            (currentTotal) => currentTotal - matchingFundingReceivedFunding + +fundingReceivedEnteredAmount
        );

        const updatedFundingReceived = enteredFundingReceived.map((fundingEntry) => {
            if (fundingEntry.id === NO_DATA) {
                return fundingEntry.tempId === newFundingReceived.tempId
                    ? { ...matchingFundingReceived, ...newFundingReceived }
                    : fundingEntry;
            } else {
                return fundingEntry.id === newFundingReceived.id
                    ? { ...matchingFundingReceived, ...newFundingReceived }
                    : fundingEntry;
            }
        });
        setEnteredFundingReceived(updatedFundingReceived);
    };

    /** @param {React.FormEvent<HTMLFormElement>} e */
    const cancelFundingReceived = (e) => {
        e.preventDefault();
        setFundingReceivedForm(initialFundingReceivedForm);
        setFundingReceivedEnteredAmount("");
        suite.reset();
    };

    /** @param {number | string} fundingReceivedId */
    const deleteFundingReceived = (fundingReceivedId) => {
        setShowModal(true);
        setModalProps({
            heading: `Are you sure you want to delete this funding received?`,
            actionButtonText: "Delete",
            secondaryButtonText: "Cancel",
            handleConfirm: () => {
                const matchingFundingReceived = enteredFundingReceived.find((fundingItem) => {
                    if (fundingItem.id === NO_DATA) {
                        return fundingItem.tempId === fundingReceivedId;
                    }
                    return fundingItem.id === fundingReceivedId;
                });

                const newEnteredFundingReceived = enteredFundingReceived.filter((fundingItem) => {
                    const shouldNotDelete =
                        fundingItem.id === NO_DATA
                            ? fundingItem.tempId !== matchingFundingReceived?.tempId
                            : fundingItem.id !== matchingFundingReceived?.id;
                    return shouldNotDelete;
                });

                setEnteredFundingReceived(newEnteredFundingReceived);

                if (matchingFundingReceived?.id !== NO_DATA) {
                    const newDeletedFundingReceivedIds = [...deletedFundingReceivedIds, fundingReceivedId];
                    setDeletedFundingReceivedIds(newDeletedFundingReceivedIds);
                }
                setTotalReceived((currentTotal) => currentTotal - +(matchingFundingReceived?.funding ?? 0));
                setAlert({
                    type: "success",
                    heading: "Funding Received Deleted",
                    message: `The funding received has been successfully deleted.`
                });
            }
        });
    };

    const handleCancel = () => {
        setShowModal(true);
        setModalProps({
            heading: "Are you sure you want to cancel editing? Your changes will not be saved.",
            actionButtonText: "Cancel Edits",
            secondaryButtonText: "Continue Editing",
            handleConfirm: () => {
                setIsCancelling(true);
                setTotalReceived(receivedFunding || 0);
                cleanUp();
            }
        });
    };

    const cleanUp = () => {
        setDeletedFundingReceivedIds([]);
        setEnteredFundingReceived([...fundingReceived]);
        setBudgetForm({ submittedAmount: totalFunding, isSubmitted: false });
        setBudgetEnteredAmount(totalFunding);
        setShowModal(false);
        setFundingReceivedForm(initialFundingReceivedForm);
        setFundingReceivedEnteredAmount("");
        toggleEditMode();
        resetWelcomeModal();
        setModalProps({
            heading: "",
            actionButtonText: "",
            secondaryButtonText: "",
            handleConfirm: () => {}
        });
        suite.reset();
        scrollToTop();
    };

    /**
     * Executes validation for a specific form field
     * @param {string} name - The name of the form field to validate
     * @param {number|string} value - The value to validate for the given field
     * @returns {void}
     */
    const runValidate = (name, value) => {
        suite.run(
            {
                remainingAmount: +budgetForm.submittedAmount - totalReceived + +fundingReceivedForm.originalAmount,
                receivedFunding,
                ...{ [name]: value }
            },
            name
        );
    };

    /**
     * Populates the funding received form with data from a selected funding record
     * @param {(string|number)} fundingReceivedId - The ID of the funding record to populate (can be a temporary ID or actual ID)
     * @returns {void}
     * @description
     * This function finds a matching funding record from enteredFundingReceived array using either
     * a temporary ID or actual ID. It then creates a form object with the funding amount, notes,
     * and relevant IDs, setting isEditing to true. The form data is then set using setFundingReceivedForm.
     */
    const populateFundingReceivedForm = (fundingReceivedId) => {
        const matchingFundingReceived = fundingReceivedId.toString().includes("temp")
            ? enteredFundingReceived.find((f) => f.tempId === fundingReceivedId)
            : enteredFundingReceived.find((f) => f.id === fundingReceivedId);

        if (!matchingFundingReceived) {
            return;
        }

        const { funding, notes } = matchingFundingReceived;
        const nextForm = {
            enteredNotes: notes,
            originalAmount: funding,
            isEditing: true,
            id: fundingReceivedId.toString().includes("temp") ? NO_DATA : fundingReceivedId,
            tempId: matchingFundingReceived?.tempId
        };

        setFundingReceivedForm(nextForm);
        setFundingReceivedEnteredAmount(funding);
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
        deleteFundingReceived,
        deletedFundingReceivedIds,
        budgetEnteredAmount,
        fundingReceivedEnteredAmount,
        showBlockerModal,
        setShowBlockerModal,
        blockerModalProps
    };
}
