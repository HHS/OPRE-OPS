import React from "react";
import PropTypes from "prop-types";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import PreviewTable from "../../../components/UI/PreviewTable/PreviewTable";
import AgreementDetailHeader from "./AgreementDetailHeader";
import CreateBudgetLinesForm from "../../../components/UI/Form/CreateBudgetLinesForm";
import Modal from "../../../components/UI/Modal";
import Alert from "../../../components/UI/Alert";
import { loggedInName } from "../../../helpers/utils";
import { postBudgetLineItems } from "../../../api/postBudgetLineItems";
import { patchBudgetLineItems } from "../../../api/patchBudgetLineItems";
import {
    CreateBudgetLinesProvider,
    useBudgetLines,
    useBudgetLinesDispatch,
    useSetState,
} from "../../../components/UI/WizardSteps/StepCreateBudgetLines/context";
/**
 * Agreement budget lines.
 * @param {Object} props - The component props.
 * @param {Object} props.agreement - The agreement to display.
 * @returns {React.JSX.Element} - The rendered component.
 */
export const AgreementBudgetLines = ({ agreement }) => {
    const [isEditMode, setIsEditMode] = React.useState(false);
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

        dispatch({ type: "RESET_FORM_AND_BUDGET_LINES" });

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
        <CreateBudgetLinesProvider>
            {showModal && (
                <Modal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    handleConfirm={modalProps.handleConfirm}
                />
            )}
            {isAlertActive && <Alert />}
            <AgreementDetailHeader
                heading="Budget Lines"
                details="This is a list of all budget lines within this agreement."
                isEditMode={isEditMode}
                setIsEditMode={setIsEditMode}
            />
            {isEditMode && (
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
                    isReviewMode={false}
                />
            )}
            {agreement?.budget_line_items.length > 0 ? (
                <PreviewTable
                    budgetLinesAdded={agreement?.budget_line_items}
                    handleSetBudgetLineForEditing={handleSetBudgetLineForEditing}
                    handleDeleteBudgetLine={handleDeleteBudgetLine}
                    handleDuplicateBudgetLine={handleDuplicateBudgetLine}
                    readOnly={!isEditMode}
                />
            ) : (
                <p>No budget lines.</p>
            )}

            <div className="grid-row flex-justify-end margin-top-1">
                <Link
                    className="usa-button float-right margin-top-4 margin-right-0"
                    to={`/agreements/approve/${agreement?.id}`}
                >
                    Plan or Execute Budget Lines
                </Link>
            </div>
        </CreateBudgetLinesProvider>
    );
};

AgreementBudgetLines.propTypes = {
    agreement: PropTypes.shape({
        id: PropTypes.number,
        budget_line_items: PropTypes.arrayOf(PropTypes.object),
    }),
};

export default AgreementBudgetLines;
