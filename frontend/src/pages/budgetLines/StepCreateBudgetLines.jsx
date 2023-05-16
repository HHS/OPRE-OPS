import React from "react";
import { useSelector } from "react-redux";
import StepIndicator from "../../components/UI/StepIndicator/StepIndicator";
import { ProjectAgreementSummaryCard } from "../budgetLines/ProjectAgreementSummaryCard";
import PreviewTable from "../budgetLines/PreviewTable";
import Alert from "../../components/UI/Alert/Alert";
import Modal from "../../components/UI/Modal/Modal";
import CreateBudgetLinesForm from "../../components/UI/Form/CreateBudgetLinesForm";
import ProcurementShopSelect from "./ProcurementShopSelect";
import { postBudgetLineItems } from "../../api/postBudgetLineItems";
import { useBudgetLines, useBudgetLinesDispatch, useSetState } from "./budgetLineContext";

export const StepCreateBudgetLines = ({ goToNext, goBack }) => {
    const [isAlertActive, setIsAlertActive] = React.useState(false);
    const [alertProps, setAlertProps] = React.useState({});
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({});
    const {
        wizardSteps,
        selected_project: selectedResearchProject,
        selected_agreement: selectedAgreement,
        selected_procurement_shop: selectedProcurementShop,
        budget_lines_added: budgetLinesAdded,
        selected_can: selectedCan,
        entered_description: enteredDescription,
        entered_amount: enteredAmount,
        entered_month: enteredMonth,
        entered_day: enteredDay,
        entered_year: enteredYear,
        entered_comments: enteredComments,
        is_editing_budget_line: isEditing,
        budget_line_being_edited: budgetLineBeingEdited,
    } = useBudgetLines();

    const dispatch = useBudgetLinesDispatch();
    // setters
    const setSelectedProcurementShop = useSetState("selected_procurement_shop");
    const setEnteredDescription = useSetState("entered_description");
    const setSelectedCan = useSetState("selected_can");
    const setEnteredAmount = useSetState("entered_amount");
    const setEnteredMonth = useSetState("entered_month");
    const setEnteredDay = useSetState("entered_day");
    const setEnteredYear = useSetState("entered_year");
    const setEnteredComments = useSetState("entered_comments");
    let loggedInUser = useSelector((state) => state.auth.activeUser.full_name);

    // NOTE: set to logged in user to Sheila if no name is found
    if (!loggedInUser) {
        loggedInUser = "Sheila Celentano";
    }

    const showAlert = async (type, heading, message) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        window.scrollTo(0, 0);
        setIsAlertActive(true);
        setAlertProps({ type, heading, message });

        await new Promise((resolve) => setTimeout(resolve, 6000));
        setIsAlertActive(false);
        setAlertProps({});
    };

    const handleSubmitForm = (e) => {
        e.preventDefault();
        dispatch({
            type: "ADD_BUDGET_LINE",
            payload: {
                id: crypto.getRandomValues(new Uint32Array(1))[0],
                line_description: enteredDescription || "",
                comments: enteredComments || "No comments",
                can_id: selectedCan?.id || null,
                can: selectedCan || null,
                agreement_id: selectedAgreement?.id || null,
                amount: enteredAmount || 0,
                status: "DRAFT",
                date_needed: `${enteredYear}-${enteredMonth}-${enteredDay}` || null,
                psc_fee_amount: selectedProcurementShop?.fee || null,
            },
        });
        dispatch({ type: "RESET_FORM" });
        showAlert("success", "Budget Line Added", "The budget line has been successfully added.");
    };

    const handleEditForm = (e) => {
        e.preventDefault();
        dispatch({
            type: "EDIT_BUDGET_LINE",
            payload: {
                id: budgetLinesAdded[budgetLineBeingEdited].id,
                line_description: enteredDescription,
                comments: enteredComments,
                can_id: selectedCan?.id,
                can: selectedCan,
                agreement_id: selectedAgreement?.id,
                amount: enteredAmount,
                date_needed:
                    enteredYear && enteredMonth && enteredDay ? `${enteredYear}-${enteredMonth}-${enteredDay}` : null,
                psc_fee_amount: selectedProcurementShop?.fee,
            },
        });

        dispatch({ type: "RESET_FORM" });
        showAlert("success", "Budget Line Updated", "The budget line has been successfully edited.");
    };

    const handleDeleteBudgetLine = (budgetLineId) => {
        setShowModal(true);
        setModalProps({
            heading: "Are you sure you want to delete this budget line?",
            actionButtonText: "Delete",
            handleConfirm: () => {
                dispatch({
                    type: "DELETE_BUDGET_LINE",
                    id: budgetLineId,
                });
                dispatch({ type: "RESET_FORM" });
                showAlert("success", "Budget Line Deleted", "The budget line has been successfully deleted.");
                setModalProps({});
            },
        });
    };

    const saveBudgetLineItems = (event) => {
        event.preventDefault();
        const newBudgetLineItems = budgetLinesAdded.filter(
            // eslint-disable-next-line no-prototype-builtins
            (budgetLineItem) => !budgetLineItem.hasOwnProperty("created_on")
        );
        postBudgetLineItems(newBudgetLineItems).then(() => console.log("Created New BLIs."));
        dispatch({ type: "RESET_FORM_AND_BUDGET_LINES" });
        goToNext();
    };

    const handleResetForm = () => dispatch({ type: "RESET_FORM" });

    const handleSetBudgetLineForEditing = (budgetLine) => {
        dispatch({ type: "SET_BUDGET_LINE_FOR_EDITING", payload: budgetLine });
    };

    const handleDuplicateBudgetLine = (budgetLine) => {
        dispatch({
            type: "DUPLICATE_BUDGET_LINE",
            payload: { ...budgetLine, created_by: loggedInUser },
        });
    };

    return (
        <>
            {showModal && (
                <Modal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    handleConfirm={modalProps.handleConfirm}
                />
            )}

            {isAlertActive ? (
                <Alert heading={alertProps.heading} type={alertProps.type} setIsAlertActive={setIsAlertActive}>
                    {alertProps.message}
                </Alert>
            ) : (
                <>
                    <h2 className="font-sans-lg">Create New Budget Line</h2>
                    <p>Step Two: Text explaining this page</p>
                </>
            )}
            <StepIndicator steps={wizardSteps} currentStep={2} />
            <ProjectAgreementSummaryCard
                selectedResearchProject={selectedResearchProject}
                selectedAgreement={selectedAgreement}
                selectedProcurementShop={selectedProcurementShop}
            />
            <h2 className="font-sans-lg">Procurement Shop</h2>
            <p>
                Select the Procurement Shop, and the fee rates will be populated in the table below. If this is an
                active agreement, it will default to the procurement shop currently being used.
            </p>
            <ProcurementShopSelect
                budgetLinesLength={budgetLinesAdded?.length}
                selectedProcurementShop={selectedProcurementShop}
                setSelectedProcurementShop={setSelectedProcurementShop}
            />
            <h2 className="font-sans-lg margin-top-3">Budget Line Details</h2>
            <p>
                Complete the information below to create new budget lines. Select Add Budget Line to create multiple
                budget lines.
            </p>
            <CreateBudgetLinesForm
                selectedCan={selectedCan}
                enteredDescription={enteredDescription}
                enteredAmount={enteredAmount}
                enteredMonth={enteredMonth}
                enteredDay={enteredDay}
                enteredYear={enteredYear}
                enteredComments={enteredComments}
                isEditing={isEditing}
                setEnteredDescription={setEnteredDescription}
                setSelectedCan={setSelectedCan}
                setEnteredAmount={setEnteredAmount}
                setEnteredMonth={setEnteredMonth}
                setEnteredDay={setEnteredDay}
                setEnteredYear={setEnteredYear}
                setEnteredComments={setEnteredComments}
                handleEditForm={handleEditForm}
                handleResetForm={handleResetForm}
                handleSubmitForm={handleSubmitForm}
            />
            <h2 className="font-sans-lg">Budget Lines</h2>
            <p>
                This is a list of all budget lines for the selected project and agreement. The budget lines you add will
                display in draft status. The Fiscal Year (FY) will populate based on the election date you provide.
            </p>
            <PreviewTable
                loggedInUser={loggedInUser}
                budgetLinesAdded={budgetLinesAdded}
                handleSetBudgetLineForEditing={handleSetBudgetLineForEditing}
                handleDeleteBudgetLine={handleDeleteBudgetLine}
                handleDuplicateBudgetLine={handleDuplicateBudgetLine}
            />
            <div className="grid-row flex-justify-end margin-top-1">
                <button
                    className="usa-button usa-button--unstyled margin-right-2"
                    onClick={() => {
                        // if no budget lines have been added, go back
                        if (budgetLinesAdded?.length === 0) {
                            goBack();
                            return;
                        }
                        // if budget lines have been added, show modal
                        setShowModal(true);
                        setModalProps({
                            heading: "Are you sure you want to go back? Your budget lines will not be saved.",
                            actionButtonText: "Go Back",
                            handleConfirm: () => {
                                dispatch({ type: "RESET_FORM_AND_BUDGET_LINES" });
                                setModalProps({});
                                goBack();
                            },
                        });
                    }}
                >
                    Back
                </button>
                <button className="usa-button" onClick={saveBudgetLineItems}>
                    Create Budget Lines
                </button>
            </div>
        </>
    );
};

export default StepCreateBudgetLines;
