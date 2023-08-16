import React from "react";
import PropTypes from "prop-types";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import StepIndicator from "../../StepIndicator/StepIndicator";
import ProjectAgreementSummaryCard from "../../Form/ProjectAgreementSummaryCard";
import PreviewTable from "../../PreviewTable";
import Alert from "../../Alert";
import Modal from "../../Modal";
import CreateBudgetLinesForm from "../../Form/CreateBudgetLinesForm";
import { useBudgetLines, useBudgetLinesDispatch, useSetState } from "./context";
import { setAlert } from "../../Alert/alertSlice";
import EditModeTitle from "../../../../pages/agreements/EditModeTitle";
import { loggedInName } from "../../../../helpers/utils";
import suite from "./suite";
import { convertCodeForDisplay } from "../../../../helpers/utils";
import { useUpdateBudgetLineItemMutation, useAddBudgetLineItemMutation } from "../../../../api/opsAPI";

/**
 * Renders the Create Budget Lines component with React context.
 *
 * @param {Object} props - The component props.
 * @param {Function} [props.goToNext] - A function to navigate to the next step in the flow. - optional
 * @param {Function} [props.goBack] - A function to navigate to the previous step in the flow. - optional
 * @param {Array<String>} props.wizardSteps - An array of objects representing the steps in the flow.
 * @param {number} props.currentStep - The index of the current step in the flow.
 * @param {Object} props.selectedResearchProject - The selected research project.
 * @param {Object} props.selectedAgreement - The selected agreement.
 * @param {Object} props.selectedProcurementShop - The selected procurement shop.
 * @param {Array<any>} props.existingBudgetLines - An array of existing budget lines.
 * @param {string} props.continueBtnText - The text to display on the "Continue" button.
 * @param {boolean} props.isEditMode - Whether the form is in edit mode.
 * @param {Function} props.setIsEditMode - A function to set the edit mode state.
 * @param {boolean} props.isReviewMode - Whether the form is in review mode.
 * @param {Function} [props.continueOverRide] - A function to override the default "Continue" button behavior. - optional
 * @param {"agreement" | "budgetLines" | "none"} props.workflow - The workflow type.
 * @returns {React.JSX.Element} - The rendered component.
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
    continueOverRide,
    isEditMode,
    setIsEditMode = () => {},
    isReviewMode,
    workflow,
}) => {
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
    const globalDispatch = useDispatch();
    const navigate = useNavigate();
    const [updateBudgetLineItem] = useUpdateBudgetLineItemMutation();
    const [addBudgetLineItem] = useAddBudgetLineItemMutation();
    // setters
    const setEnteredDescription = useSetState("entered_description");
    const setSelectedCan = useSetState("selected_can");
    const setEnteredAmount = useSetState("entered_amount");
    const setEnteredMonth = useSetState("entered_month");
    const setEnteredDay = useSetState("entered_day");
    const setEnteredYear = useSetState("entered_year");
    const setEnteredComments = useSetState("entered_comments");

    const isAlertActive = useSelector((state) => state.alert.isActive);

    let loggedInUserFullName = useSelector((state) => loggedInName(state.auth?.activeUser));

    // combine arrays of new budget lines and existing budget lines added
    // only run once on page load if there are existing budget lines
    React.useEffect(() => {
        if (existingBudgetLines.length > 0) {
            dispatch({ type: "ADD_EXISTING_BUDGET_LINES", payload: existingBudgetLines });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [existingBudgetLines]);

    let res = suite.get();
    const pageErrors = res.getErrors();

    if (isReviewMode) {
        suite({
            new_budget_lines: newBudgetLines,
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
        globalDispatch(
            setAlert({
                type: "success",
                heading: "Budget Line Added",
                message: "The budget line has been successfully added.",
            })
        );
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
        globalDispatch(
            setAlert({
                type: "success",
                heading: "Budget Line Updated",
                message: "The budget line has been successfully edited.",
            })
        );
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
                globalDispatch(
                    setAlert({
                        type: "success",
                        heading: "Budget Line Deleted",
                        message: "The budget line has been successfully deleted.",
                    })
                );
                setModalProps({});
            },
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
                        addBudgetLineItem(data);
                    })
                );
            }
            if (method === "PATCH") {
                return Promise.all(
                    items.map((item) => {
                        const { id, data } = cleanBudgetLineItemForApi(item);
                        updateBudgetLineItem({ id, data });
                    })
                );
            }
        };
        const newBudgetLineItems = newBudgetLines.filter((budgetLineItem) => !("created_on" in budgetLineItem));
        const existingBudgetLineItems = newBudgetLines.filter((budgetLineItem) => "created_on" in budgetLineItem);

        if (newBudgetLineItems.length > 0) {
            mutateBudgetLineItems("POST", newBudgetLineItems).then(() => console.log("Created New BLIs."));
        }
        if (existingBudgetLineItems.length > 0) {
            mutateBudgetLineItems("PATCH", existingBudgetLineItems).then(() => console.log("Updated BLIs."));
        }
        // cleanup
        dispatch({ type: "RESET_FORM" });
        setIsEditMode(false);
        // handle next step
        if (isReviewMode) {
            navigate(`/agreements/approve/${selectedAgreement.id}`);
        } else if (continueOverRide) {
            continueOverRide();
        } else {
            goToNext();
        }
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
                <Alert />
            ) : (
                <>
                    {
                        // if workflow is none, skip the title
                        workflow !== "none" ? (
                            workflow === "agreement" ? (
                                <EditModeTitle isEditMode={isEditMode || isReviewMode} />
                            ) : (
                                <>
                                    <h2 className="font-sans-lg">Create New Budget Line</h2>
                                    <p>Step Two: Text explaining this page</p>
                                </>
                            )
                        ) : null
                    }
                </>
            )}
            {workflow !== "none" && (
                <>
                    <StepIndicator steps={wizardSteps} currentStep={currentStep} />
                    <ProjectAgreementSummaryCard
                        selectedResearchProject={selectedResearchProject}
                        selectedAgreement={selectedAgreement}
                        selectedProcurementShop={selectedProcurementShop}
                    />
                    <h2 className="font-sans-lg margin-top-3">Budget Line Details</h2>
                    <p>
                        Complete the information below to create new budget lines. Select Add Budget Line to create
                        multiple budget lines.
                    </p>
                </>
            )}
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
                isEditMode={isEditMode}
                isReviewMode={isReviewMode}
            />
            {workflow !== "none" && (
                <>
                    <h2 className="font-sans-lg">Budget Lines</h2>
                    <p>
                        This is a list of all budget lines for the selected project and agreement. The budget lines you
                        add will display in draft status. The Fiscal Year (FY) will populate based on the election date
                        you provide.
                    </p>
                </>
            )}
            {budgetLinePageErrorsExist && (
                <ul className="usa-list--unstyled font-12px text-error" data-cy="error-list">
                    {Object.entries(pageErrors).map(([key, value]) => (
                        <li key={key} className="border-left-2px padding-left-1" data-cy="error-item">
                            <strong>{convertCodeForDisplay("validation", key)}: </strong>
                            {
                                <span>
                                    {value.map((message, index) => (
                                        <React.Fragment key={index}>
                                            <span>{message}</span>
                                            {index < value.length - 1 && <span>, </span>}
                                        </React.Fragment>
                                    ))}
                                </span>
                            }
                        </li>
                    ))}
                </ul>
            )}
            <PreviewTable
                budgetLinesAdded={newBudgetLines}
                handleSetBudgetLineForEditing={handleSetBudgetLineForEditing}
                handleDeleteBudgetLine={handleDeleteBudgetLine}
                handleDuplicateBudgetLine={handleDuplicateBudgetLine}
                isReviewMode={isReviewMode}
            />
            <div className="grid-row flex-justify-end margin-top-1">
                <button
                    className="usa-button usa-button--unstyled margin-right-2"
                    data-cy="back-button"
                    onClick={() => {
                        // if no budget lines have been added, go back
                        if (newBudgetLines?.length === 0) {
                            if (workflow === "none") {
                                setIsEditMode(false);
                                navigate(`/agreements/${selectedAgreement?.id}`);
                            } else {
                                goBack();
                                return;
                            }
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
                <button
                    className="usa-button"
                    data-cy="continue-btn"
                    onClick={saveBudgetLineItems}
                    disabled={isReviewMode && !res.isValid()}
                >
                    {isReviewMode ? "Review" : continueBtnText}
                </button>
            </div>
        </>
    );
};

StepCreateBudgetLines.propTypes = {
    goToNext: PropTypes.func,
    goBack: PropTypes.func,
    wizardSteps: PropTypes.arrayOf(PropTypes.string).isRequired,
    currentStep: PropTypes.number.isRequired,
    selectedResearchProject: PropTypes.object,
    selectedAgreement: PropTypes.object,
    selectedProcurementShop: PropTypes.object,
    existingBudgetLines: PropTypes.arrayOf(PropTypes.object),
    continueBtnText: PropTypes.string.isRequired,
    isEditMode: PropTypes.bool,
    setIsEditMode: PropTypes.func,
    isReviewMode: PropTypes.bool,
    continueOverRide: PropTypes.func,
    workflow: PropTypes.oneOf(["agreement", "budgetLines"]).isRequired,
};

export default StepCreateBudgetLines;
