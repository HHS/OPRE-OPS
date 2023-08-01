import React from "react";
import PropTypes from "prop-types";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loggedInName } from "../../../helpers/utils";
import { postBudgetLineItems } from "../../../api/postBudgetLineItems";
import { patchBudgetLineItems } from "../../../api/patchBudgetLineItems";
import CreateBudgetLinesForm from "../../../components/UI/Form/CreateBudgetLinesForm";
import PreviewTable from "../../../components/UI/PreviewTable/PreviewTable";
import { setAlert } from "../../../components/UI/Alert/alertSlice";
import Modal from "../../../components/UI/Modal";
import Alert from "../../../components/UI/Alert";
import {
    useBudgetLines,
    useBudgetLinesDispatch,
    useSetState,
} from "../../../components/UI/WizardSteps/StepCreateBudgetLines/context";

/**
 * Renders Agreement budget lines view
 * @param {Object} props - The component props.
 * @param {Object} props.agreement - The agreement to display.
 * @param {boolean} props.isEditMode - Whether or not the edit mode is on.
 * @param {function} props.setIsEditMode - The function to set the edit mode.
 * @param {boolean} props.isReviewMode - Whether or not the review mode is on.
 * @returns {React.JSX.Element} - The rendered component.
 */
const AgreementDetailsEdit = ({ agreement, isEditMode, setIsEditMode, isReviewMode }) => {
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
        if (agreement?.budget_line_items.length > 0) {
            dispatch({ type: "ADD_EXISTING_BUDGET_LINES", payload: agreement.budget_line_items });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [agreement?.budget_line_items]);

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
                agreement_id: agreement?.id || null,
                amount: enteredAmount || 0,
                status: "DRAFT",
                date_needed: `${enteredYear}-${enteredMonth}-${enteredDay}` || null,
                psc_fee_amount: agreement?.procurement_shop?.fee || null,
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
                agreement_id: agreement?.id,
                amount: enteredAmount,
                date_needed:
                    enteredYear && enteredMonth && enteredDay ? `${enteredYear}-${enteredMonth}-${enteredDay}` : null,
                psc_fee_amount: agreement?.procurement_shop?.fee,
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

    const saveBudgetLineItems = (event) => {
        event.preventDefault();
        const newBudgetLineItems = newBudgetLines.filter(
            // eslint-disable-next-line no-prototype-builtins
            (budgetLineItem) => !budgetLineItem.hasOwnProperty("created_on")
        );

        const existingBudgetLineItems = newBudgetLines.filter((budgetLineItem) =>
            // eslint-disable-next-line no-prototype-builtins
            budgetLineItem.hasOwnProperty("created_on")
        );

        patchBudgetLineItems(existingBudgetLineItems).then(() => console.log("Updated BLIs."));
        postBudgetLineItems(newBudgetLineItems).then(() => console.log("Created New BLIs."));

        dispatch({ type: "RESET_FORM" });
        setIsEditMode(false);
        window.location.href = `/agreements/${agreement?.id}/budget-lines`;
    };

    const handleResetForm = () => dispatch({ type: "RESET_FORM" });

    const handleSetBudgetLineForEditing = (budgetLine) => {
        dispatch({ type: "SET_BUDGET_LINE_FOR_EDITING", payload: budgetLine });
    };

    const handleDuplicateBudgetLine = (budgetLine) => {
        const { updated_on, created_on, ...budgetLineRest } = budgetLine;
        dispatch({
            type: "DUPLICATE_BUDGET_LINE",
            payload: { ...budgetLineRest, created_by: loggedInUserFullName },
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
            {isAlertActive && <Alert />}
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
                            setIsEditMode(false);
                            navigate(`/agreements/${agreement?.id}`);
                        }
                        // if budget lines have been added, show modal
                        setShowModal(true);
                        setModalProps({
                            heading: "Are you sure you want to ? Your budget lines will not be saved.",
                            actionButtonText: "Go Back",
                            handleConfirm: () => {
                                dispatch({ type: "RESET_FORM_AND_BUDGET_LINES" });
                                setModalProps({});
                                setIsEditMode(false);
                                navigate(`/agreements/${agreement?.id}`);
                            },
                        });
                    }}
                >
                    Cancel
                </button>
                <button className="usa-button" onClick={saveBudgetLineItems}>
                    Save Changes
                </button>
            </div>
        </>
    );
};

AgreementDetailsEdit.propTypes = {
    agreement: PropTypes.shape({
        id: PropTypes.number,
        budget_line_items: PropTypes.arrayOf(PropTypes.object),
        procurement_shop: PropTypes.shape({
            fee: PropTypes.number,
        }),
    }),
    isEditMode: PropTypes.bool,
    setIsEditMode: PropTypes.func,
    isReviewMode: PropTypes.bool,
};
export default AgreementDetailsEdit;
