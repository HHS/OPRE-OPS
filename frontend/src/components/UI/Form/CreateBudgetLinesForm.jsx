import { shape, func } from "prop-types";
import { useDispatch } from "react-redux";
import CurrencyFormat from "react-currency-format";
import CanSelect from "../../../pages/budgetLines/CanSelect";
import DesiredAwardDate from "../../../pages/budgetLines/DesiredAwardDate";
import { setEditBudgetLineAdded } from "../../../pages/budgetLines/createBudgetLineSlice";
import { useBudgetLines, useBudgetLinesDispatch } from "../../../pages/budgetLines/budgetLineContext";

export const CreateBudgetLinesForm = ({
    showAlert = () => {},
    // todo: add these reducers to the context
    handleCancelEdit = () => {},
    resetFormState = () => {},
}) => {
    // const dispatch = useDispatch();
    const {
        selectedAgreement,
        selectedProcurementShop,
        budgetLinesAdded,
        setBudgetLinesAdded = () => {},
        selectedCan,
        setSelectedCan = () => {},
        enteredDescription,
        setEnteredDescription = () => {},
        enteredAmount,
        setEnteredAmount = () => {},
        enteredMonth,
        setEnteredMonth = () => {},
        enteredDay,
        setEnteredDay = () => {},
        enteredYear,
        setEnteredYear = () => {},
        enteredComments,
        setEnteredComments = () => {},
        isEditing,
        setIsEditing = () => {},
        budgetLineBeingEdited,
        setBudgetLineBeingEdited = () => {},
    } = useBudgetLines();
    const dispatch = useBudgetLinesDispatch();

    const handleEditForm = (e) => {
        e.preventDefault();
        // dispatch(
        //     setEditBudgetLineAdded({
        //         id: budgetLinesAdded[budgetLineBeingEdited].id,
        //         line_description: enteredDescription,
        //         comments: enteredComments,
        //         can_id: selectedCan?.id,
        //         can: selectedCan,
        //         agreement_id: selectedAgreement?.id,
        //         amount: enteredAmount,
        //         date_needed:
        //             enteredYear && enteredMonth && enteredDay ? `${enteredYear}-${enteredMonth}-${enteredDay}` : null,
        //         psc_fee_amount: selectedProcurementShop?.fee,
        //     })
        // );
        showAlert("success", "Budget Line Updated", "The budget line has been successfully edited.");
    };

    const handleSubmitForm = (e) => {
        e.preventDefault();

        // setBudgetLinesAdded([
        //     ...budgetLinesAdded,
        //     {
        //         id: crypto.getRandomValues(new Uint32Array(1))[0],
        //         line_description: enteredDescription || "",
        //         comments: enteredComments || "No comments",
        //         can_id: selectedCan?.id || null,
        //         can: selectedCan || null,
        //         agreement_id: selectedAgreement?.id || null,
        //         amount: enteredAmount || 0,
        //         status: "DRAFT",
        //         date_needed: `${enteredYear}-${enteredMonth}-${enteredDay}` || null,
        //         psc_fee_amount: selectedProcurementShop?.fee || null,
        //     },
        // ]);

        dispatch({
            type: "added",
            payload: [
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
            ],
        });

        showAlert("success", "Budget Line Added", "The budget line has been successfully added.");
        resetFormState();
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
    // selectedAgreement: shape({}).isRequired,
    // selectedProcurementShop: shape({}).isRequired,
    showAlert: func.isRequired,
};

export default CreateBudgetLinesForm;
