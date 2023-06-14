import React from "react";
import { useSelector } from "react-redux";
import StepIndicator from "../../StepIndicator/StepIndicator";
import ProjectAgreementSummaryCard from "../../Form/ProjectAgreementSummaryCard";
import PreviewTable from "../../PreviewTable";
import Alert from "../../Alert/Alert";
import Modal from "../../Modal/Modal";
import CreateBudgetLinesForm from "../../Form/CreateBudgetLinesForm";
import { postBudgetLineItems } from "../../../../api/postBudgetLineItems";
import { useBudgetLines, useBudgetLinesDispatch, useSetState } from "./context";
import EditModeTitle from "../../../../pages/agreements/EditModeTitle";
import { loggedInName } from "../../../../helpers/utils";

/**
 * Renders the Create Budget Lines component with React context.
 *
 * @param {Object} props - The component props.
 * @param {Function} props.goToNext - A function to navigate to the next step in the flow.
 * @param {Function} props.goBack - A function to navigate to the previous step in the flow.
 * @param {Array<String>} props.wizardSteps - An array of objects representing the steps in the flow.
 * @param {number} props.currentStep - The index of the current step in the flow.
 * @param {Object} props.selectedResearchProject - The selected research project.
 * @param {Object} props.selectedAgreement - The selected agreement.
 * @param {Object} props.selectedProcurementShop - The selected procurement shop.
 * @param {Array<any>} props.existingBudgetLines - An array of existing budget lines.
 * @param {string} props.continueBtnText - The text to display on the "Continue" button.
 * @param {boolean} props.isEditMode - A flag indicating whether the component is in edit mode.
 * @param {"agreement" | "budgetLines"} props.workflow - The workflow type ("agreement" or "budgetLines").
 * @returns {JSX.Element} - The rendered component.
 */
export const StepCreateBudgetLines = ({
    goToNext,
    goBack,
    wizardSteps,
    currentStep,
    selectedResearchProject = {},
    selectedAgreement = {},
    selectedProcurementShop = {},
    existingBudgetLines = [],
    continueBtnText,
    isEditMode,
    workflow,
}) => {
    const [isAlertActive, setIsAlertActive] = React.useState(false);
    const [alertProps, setAlertProps] = React.useState({});
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({});
    const {
        selected_can: selectedCan,
        entered_description: enteredDescription,
        entered_amount: enteredAmount,
        entered_month: enteredMonth,
        entered_day: enteredDay,
        entered_year: enteredYear,
        entered_comments: enteredComments,
        is_editing_budget_line: isEditing,
        budget_line_being_edited: budgetLineBeingEdited,
        new_budget_lines: newBudgetLines,
    } = useBudgetLines() || {
        selected_can: null,
        entered_description: null,
        entered_amount: null,
        entered_month: null,
        entered_day: null,
        entered_year: null,
        entered_comments: null,
        is_editing_budget_line: null,
        budget_line_being_edited: null,
        new_budget_lines: [],
    };
    const dispatch = useBudgetLinesDispatch();
    // setters
    const setEnteredDescription = useSetState("entered_description");
    const setSelectedCan = useSetState("selected_can");
    const setEnteredAmount = useSetState("entered_amount");
    const setEnteredMonth = useSetState("entered_month");
    const setEnteredDay = useSetState("entered_day");
    const setEnteredYear = useSetState("entered_year");
    const setEnteredComments = useSetState("entered_comments");
    let loggedInUserFullName = useSelector((state) => loggedInName(state.auth?.activeUser));

    // combine arrays of new budget lines and existing budget lines added
    // only run once on page load if there are existing budget lines
    React.useEffect(() => {
        if (existingBudgetLines.length > 0) {
            dispatch({ type: "ADD_EXISTING_BUDGET_LINES", payload: existingBudgetLines });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                comments: enteredComments || "",
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
                id: newBudgetLines[budgetLineBeingEdited].id,
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
        const newBudgetLineItems = newBudgetLines.filter(
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
            payload: { ...budgetLine, created_by: loggedInUserFullName },
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
                    {workflow === "agreement" ? (
                        <EditModeTitle isEditMode={isEditMode} />
                    ) : (
                        <>
                            <h2 className="font-sans-lg">Create New Budget Line</h2>
                            <p>Step Two: Text explaining this page</p>
                        </>
                    )}
                </>
            )}
            <StepIndicator steps={wizardSteps} currentStep={currentStep} />
            <ProjectAgreementSummaryCard
                selectedResearchProject={selectedResearchProject}
                selectedAgreement={selectedAgreement}
                selectedProcurementShop={selectedProcurementShop}
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
                budgetLinesAdded={newBudgetLines}
                handleSetBudgetLineForEditing={handleSetBudgetLineForEditing}
                handleDeleteBudgetLine={handleDeleteBudgetLine}
                handleDuplicateBudgetLine={handleDuplicateBudgetLine}
            />
            <div className="grid-row flex-justify-end margin-top-1">
                <button
                    className="usa-button usa-button--unstyled margin-right-2"
                    data-cy="back-button"
                    onClick={() => {
                        // if no budget lines have been added, go back
                        if (newBudgetLines?.length === 0) {
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
                <button className="usa-button" data-cy="step-two-continue" onClick={saveBudgetLineItems}>
                    {continueBtnText}
                </button>
            </div>
        </>
    );
};

export default StepCreateBudgetLines;
