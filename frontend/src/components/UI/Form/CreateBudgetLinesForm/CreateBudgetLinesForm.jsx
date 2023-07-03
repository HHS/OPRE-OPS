import PropTypes from "prop-types";
import CurrencyFormat from "react-currency-format";
import CanSelect from "../CanSelect";
import DesiredAwardDate from "../DesiredAwardDate";

/**
 * A form for creating or editing a budget line.
 * @param {Object} props - The component props.
 * @param {Object} props.selectedCan - The currently selected CAN.
 * @param {string} props.enteredDescription - The entered budget line description.
 * @param {number} props.enteredAmount - The entered budget line amount.
 * @param {string|number} props.enteredMonth - The entered budget line desired award month.
 * @param {string|number} props.enteredDay - The entered budget line desired award day.
 * @param {string|number} props.enteredYear - The entered budget line desired award year.
 * @param {string} props.enteredComments - The entered budget line comments.
 * @param {boolean} props.isEditing - Whether the form is in edit mode.
 * @param {function} props.setEnteredDescription - A function to set the entered budget line description.
 * @param {function} props.setSelectedCan - A function to set the selected CAN.
 * @param {function} props.setEnteredAmount - A function to set the entered budget line amount.
 * @param {function} props.setEnteredMonth - A function to set the entered budget line desired award month.
 * @param {function} props.setEnteredDay - A function to set the entered budget line desired award day.
 * @param {function} props.setEnteredYear - A function to set the entered budget line desired award year.
 * @param {function} props.setEnteredComments - A function to set the entered budget line comments.
 * @param {function} props.handleEditForm - A function to handle editing the budget line form.
 * @param {function} props.handleSubmitForm - A function to handle submitting the budget line form.
 * @param {function} props.handleResetForm - A function to handle resetting the budget line form.
 * @returns {JSX.Element} - The rendered component.
 */
export const CreateBudgetLinesForm = ({
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
                <div className="usa-form-group">
                    <CanSelect selectedCan={selectedCan} setSelectedCan={setSelectedCan} />
                </div>
            </div>
            <div className="grid-col-4">
                <DesiredAwardDate
                    enteredMonth={enteredMonth}
                    setEnteredMonth={setEnteredMonth}
                    enteredDay={enteredDay}
                    setEnteredDay={setEnteredDay}
                    enteredYear={enteredYear}
                    setEnteredYear={setEnteredYear}
                />
                <div className="usa-form-group">
                    <label className="usa-label" htmlFor="bl-amount">
                        Amount
                    </label>
                    <CurrencyFormat
                        id="bl-amount"
                        value={enteredAmount || ""}
                        className="usa-input"
                        name="bl-amount"
                        thousandSeparator={true}
                        decimalScale={2}
                        renderText={(value) => value}
                        placeholder="$"
                        onValueChange={(values) => {
                            const { floatValue } = values;
                            setEnteredAmount(floatValue);
                        }}
                    />
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

CreateBudgetLinesForm.propTypes = {
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

export default CreateBudgetLinesForm;
