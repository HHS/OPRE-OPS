import { shape, func } from "prop-types";
import { useSelector, useDispatch } from "react-redux";
import CurrencyFormat from "react-currency-format";
import CanSelect from "../../../pages/budgetLines/CanSelect";
import DesiredAwardDate from "../../../pages/budgetLines/DesiredAwardDate";
import {
    setBudgetLineAdded,
    setEditBudgetLineAdded,
    setEnteredDescription,
    setEnteredAmount,
    setSelectedCan,
    setEnteredMonth,
    setEnteredYear,
    setEnteredDay,
    setEnteredComments,
} from "../../../pages/budgetLines/createBudgetLineSlice";

export const CreateBudgetLinesForm = ({
    selectedAgreement = {},
    selectedProcurementShop = {},
    showAlert = () => {},
}) => {
    const dispatch = useDispatch();
    const budgetLinesAdded = useSelector((state) => state.createBudgetLine.budget_lines_added);
    const selectedCan = useSelector((state) => state.createBudgetLine.selected_can);
    const enteredDescription = useSelector((state) => state.createBudgetLine.entered_description);
    const enteredAmount = useSelector((state) => state.createBudgetLine.entered_amount);
    const enteredMonth = useSelector((state) => state.createBudgetLine.entered_month);
    const enteredDay = useSelector((state) => state.createBudgetLine.entered_day);
    const enteredYear = useSelector((state) => state.createBudgetLine.entered_year);
    const enteredComments = useSelector((state) => state.createBudgetLine.entered_comments);
    const isEditing = useSelector((state) => state.createBudgetLine.is_editing_budget_line);
    const budgetLineBeingEdited = useSelector((state) => state.createBudgetLine.budget_line_being_edited);

    const handleCancelEdit = () => {
        dispatch(setEditBudgetLineAdded({}));
    };

    const handleEditForm = (e) => {
        e.preventDefault();
        dispatch(
            setEditBudgetLineAdded({
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
            })
        );
        showAlert("success", "Budget Line Updated", "The budget line has been successfully edited.");
    };

    const handleSubmitForm = (e) => {
        e.preventDefault();
        dispatch(
            setBudgetLineAdded([
                ...budgetLinesAdded,
                {
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
            ])
        );
        showAlert("success", "Budget Line Added", "The budget line has been successfully added.");

        //reset form
        dispatch(setEnteredDescription(""));
        dispatch(setEnteredAmount(null));
        dispatch(setSelectedCan({}));
        dispatch(setEnteredMonth(""));
        dispatch(setEnteredDay(""));
        dispatch(setEnteredYear(""));
        dispatch(setEnteredComments(""));
    };

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
                        onChange={(e) => dispatch(setEnteredDescription(e.target.value))}
                        required
                    />
                </div>
                <div className="usa-form-group">
                    <CanSelect />
                </div>
            </div>
            <div className="grid-col-4">
                <DesiredAwardDate />
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
                            dispatch(setEnteredAmount(floatValue));
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
                            onChange={(e) => dispatch(setEnteredComments(e.target.value))}
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
                            onClick={() => handleCancelEdit()}
                        >
                            Cancel
                        </button>
                        <button
                            className="usa-button usa-button--outline margin-top-2 margin-right-0"
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
    selectedAgreement: shape({}).isRequired,
    selectedProcurementShop: shape({}).isRequired,
    showAlert: func.isRequired,
};

export default CreateBudgetLinesForm;
