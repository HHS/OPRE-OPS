import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import PreviewTable from "../../../components/UI/PreviewTable/PreviewTable";
import AgreementDetailHeader from "./AgreementDetailHeader";
import CreateBudgetLinesForm from "../../../components/UI/Form/CreateBudgetLinesForm";

/**
 * Agreement budget lines.
 * @param {Object} props - The component props.
 * @param {Object} props.agreement - The agreement to display.
 * @param {boolean} props.isEditMode - Whether the edit mode is on.
 * @param {function} props.setIsEditMode - The function to set the edit mode.
 * @returns {React.JSX.Element} - The rendered component.
 */
export const AgreementBudgetLines = ({ agreement, isEditMode, setIsEditMode }) => {
    const initialState = {
        selectedCan: "",
        enteredDescription: "",
        enteredAmount: "",
        enteredMonth: "",
        enteredDay: "",
        enteredYear: "",
        enteredComments: "",
        isEditing: false,
    };
    const [formDetails, setFormDetails] = React.useReducer(
        (state, newState) => ({ ...state, ...newState }),
        initialState
    );
    return (
        <form onSubmit={(e) => e.preventDefault()}>
            <AgreementDetailHeader
                heading="Budget Lines"
                details="This is a list of all budget lines within this agreement."
                isEditMode={isEditMode}
                setIsEditMode={setIsEditMode}
            />
            {isEditMode && (
                <CreateBudgetLinesForm
                    selectedCan={formDetails.selectedCan}
                    enteredDescription={formDetails.enteredDescription}
                    enteredAmount={formDetails.enteredAmount}
                    enteredMonth={formDetails.enteredMonth}
                    enteredDay={formDetails.enteredDay}
                    enteredYear={formDetails.enteredYear}
                    enteredComments={formDetails.enteredComments}
                    isEditing={formDetails.isEditing}
                    setEnteredDescription={() => setFormDetails({ enteredDescription: event.target.value })}
                    setSelectedCan={() => setFormDetails({ selectedCan: event.target.value })}
                    setEnteredAmount={() => setFormDetails({ enteredAmount: event.target.value })}
                    setEnteredMonth={() => setFormDetails({ enteredMonth: event.target.value })}
                    setEnteredDay={() => setFormDetails({ enteredDay: event.target.value })}
                    setEnteredYear={() => setFormDetails({ enteredYear: event.target.value })}
                    setEnteredComments={() => setFormDetails({ enteredComments: event.target.value })}
                    handleEditForm={() => {}}
                    handleResetForm={() => {}}
                    handleSubmitForm={() => {}}
                    isEditMode={isEditMode}
                    isReviewMode={false}
                />
            )}
            {agreement?.budget_line_items.length > 0 ? (
                <PreviewTable budgetLinesAdded={agreement?.budget_line_items} readOnly={!isEditMode} />
            ) : (
                <p>No budget lines.</p>
            )}
            {isEditMode && <p>EDIT MODE IS ON!</p>}
            <div className="grid-row flex-justify-end margin-top-1">
                <Link
                    className="usa-button float-right margin-top-4 margin-right-0"
                    to={`/agreements/approve/${agreement?.id}`}
                >
                    Plan or Execute Budget Lines
                </Link>
            </div>
        </form>
    );
};

AgreementBudgetLines.propTypes = {
    agreement: PropTypes.shape({
        id: PropTypes.number,
        budget_line_items: PropTypes.arrayOf(PropTypes.object),
    }),
    isEditMode: PropTypes.bool,
    setIsEditMode: PropTypes.func,
};

export default AgreementBudgetLines;
