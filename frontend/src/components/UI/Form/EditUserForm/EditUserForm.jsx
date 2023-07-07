import PropTypes from "prop-types";

export const EditUserForm = ({
    selectedCan,
    enteredDescription,
    enteredAmount,
    enteredMonth,
    enteredDay,
    enteredYear,
    enteredComments,
    isEditing,
    setEnteredDescription,
    setSelectedCan,
    setEnteredAmount,
    setEnteredMonth,
    setEnteredDay,
    setEnteredYear,
    setEnteredComments,
    handleEditForm = () => {},
    handleSubmitForm = () => {},
    handleResetForm = () => {},
}) => {
    return (
        <form className="grid-row grid-gap">
            <div className="grid-col-4">
                <div className="usa-form-group">
                    <label className="usa-label" htmlFor="bl-description">
                        Description
                    </label>
                    <input
                        className="usa-input"
                        id="bl-description"
                        name="bl-description"
                        type="text"
                        value={enteredDescription || ""}
                        onChange={(e) => setEnteredDescription(e.target.value)}
                        required
                    />
                </div>
                <div className="usa-form-group"></div>
            </div>
            <div className="grid-col-4">
                <div className="usa-form-group">
                    <label className="usa-label" htmlFor="bl-amount">
                        Amount
                    </label>
                </div>
            </div>
            <div className="grid-col-4">
                <div className="usa-character-count">
                    <div className="usa-form-group">
                        <label className="usa-label" htmlFor="with-hint-textarea">
                            Notes (optional)
                        </label>
                        <span id="with-hint-textarea-hint" className="usa-hint">
                            Maximum 150 characters
                        </span>
                        <textarea
                            className="usa-textarea usa-character-count__field"
                            id="with-hint-textarea"
                            maxLength="150"
                            name="with-hint-textarea"
                            rows="5"
                            aria-describedby="with-hint-textarea-info with-hint-textarea-hint"
                            style={{ height: "7rem" }}
                            value={enteredComments || ""}
                            onChange={(e) => setEnteredComments(e.target.value)}
                        ></textarea>
                    </div>
                    <span id="with-hint-textarea-info" className="usa-character-count__message sr-only">
                        You can enter up to 150 characters
                    </span>
                </div>
                {isEditing ? (
                    <div className="display-flex flex-justify-end">
                        <button
                            className="usa-button usa-button--unstyled margin-top-2 margin-right-2"
                            onClick={handleResetForm}
                        >
                            Cancel
                        </button>
                        <button
                            className="usa-button usa-button--outline margin-top-2 margin-right-0"
                            data-cy="update-budget-line"
                            onClick={handleEditForm}
                        >
                            Update Budget Line
                        </button>
                    </div>
                ) : (
                    <button
                        id="add-budget-line"
                        className="usa-button usa-button--outline margin-top-2 float-right margin-right-0"
                        onClick={handleSubmitForm}
                    >
                        Add Budget Line
                    </button>
                )}
            </div>
        </form>
    );
};

EditUserForm.propTypes = {
    selectedCan: PropTypes.object,
    enteredDescription: PropTypes.string,
    enteredAmount: PropTypes.number,
    enteredMonth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    enteredDay: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    enteredYear: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    enteredComments: PropTypes.string,
    isEditing: PropTypes.bool,
    setEnteredDescription: PropTypes.func.isRequired,
    setSelectedCan: PropTypes.func.isRequired,
    setEnteredAmount: PropTypes.func.isRequired,
    setEnteredMonth: PropTypes.func.isRequired,
    setEnteredDay: PropTypes.func.isRequired,
    setEnteredYear: PropTypes.func.isRequired,
    setEnteredComments: PropTypes.func.isRequired,
    handleEditForm: PropTypes.func.isRequired,
    handleSubmitForm: PropTypes.func.isRequired,
    handleResetForm: PropTypes.func.isRequired,
};

export default EditUserForm;
