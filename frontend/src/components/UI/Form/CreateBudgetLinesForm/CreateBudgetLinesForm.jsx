import React from "react";
import PropTypes from "prop-types";
import classnames from "vest/classnames";
import CanSelect from "../CanSelect";
import DesiredAwardDate from "../DesiredAwardDate";
import suite from "./suite";
import Input from "../Input";
import TextArea from "../TextArea/TextArea";
import CurrencyInput from "./CurrencyInput";

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
 * @param {string} props.formMode - The form mode.
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
    formMode,
}) => {
    const [isEditMode, setIsEditMode] = React.useState(false);
    const [isReviewMode, setIsReviewMode] = React.useState(false);
    let res = suite.get();
    console.log(`res: ${JSON.stringify(res, null, 2)})}`);
    const cn = classnames(suite.get(), {
        invalid: "usa-form-group--error",
        valid: "success",
        warning: "warning",
    });
    const isFormComplete =
        selectedCan && enteredDescription && enteredAmount && enteredMonth && enteredDay && enteredYear;
    React.useEffect(() => {
        switch (formMode) {
            case "edit":
                setIsEditMode(true);
                break;
            case "review":
                setIsReviewMode(true);
                // suite({
                //     selectedCan,
                //     enteredDescription,
                //     enteredAmount,
                //     enteredMonth,
                //     enteredDay,
                //     enteredYear,
                //     enteredComments,
                // });
                break;
            default:
                return;
        }
        return () => {
            setIsReviewMode(false);
            setIsEditMode(false);
            suite.reset();
        };
    }, [formMode]);

    const runValidate = (name, value) => {
        suite(
            {
                enteredDescription,
                selectedCan,
                enteredAmount,
                enteredMonth,
                enteredDay,
                enteredYear,
                ...{ [name]: value },
            },
            name
        );
    };

    return (
        <form className="grid-row grid-gap">
            <div className="grid-col-4">
                <div className="usa-form-group">
                    <Input
                        name="enteredDescription"
                        label="Description"
                        messages={res.getErrors("enteredDescription")}
                        className={cn("enteredDescription")}
                        value={enteredDescription || ""}
                        onChange={(name, value) => {
                            setEnteredDescription(value);
                            if (isReviewMode) {
                                runValidate(name, value);
                            }
                        }}
                    />
                </div>
                <div className="usa-form-group">
                    <CanSelect
                        name="selectedCan"
                        label="CAN"
                        messages={res.getErrors("selectedCan")}
                        className={cn("selectedCan")}
                        selectedCan={selectedCan}
                        setSelectedCan={setSelectedCan}
                        onChange={(name, value) => {
                            if (isReviewMode) {
                                runValidate(name, value);
                            }
                        }}
                    />
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
                    isReviewMode={isReviewMode}
                    runValidate={runValidate}
                    res={res}
                    cn={cn}
                />
                <CurrencyInput
                    name="enteredAmount"
                    label="Amount"
                    messages={res.getErrors("enteredAmount")}
                    className={cn("enteredAmount")}
                    value={enteredAmount || ""}
                    setEnteredAmount={setEnteredAmount}
                    onChange={(name, value) => {
                        if (isReviewMode) {
                            runValidate(name, value);
                        }
                    }}
                />
            </div>
            <div className="grid-col-4">
                <TextArea
                    name="enteredComments"
                    label="Notes (optional)"
                    value={enteredComments || ""}
                    hintMsg="Maximum 150 characters"
                    onChange={(name, value) => {
                        setEnteredComments(value);
                    }}
                />

                {isEditing ? (
                    <div className="display-flex flex-justify-end">
                        <button
                            className="usa-button usa-button--unstyled margin-top-2 margin-right-2"
                            onClick={() => {
                                handleResetForm();
                                if (isReviewMode) {
                                    suite.reset();
                                }
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            className="usa-button usa-button--outline margin-top-2 margin-right-0"
                            data-cy="update-budget-line"
                            disabled={res.hasErrors() || !isFormComplete}
                            onClick={handleEditForm}
                        >
                            Update Budget Line
                        </button>
                    </div>
                ) : (
                    <button
                        id="add-budget-line"
                        className="usa-button usa-button--outline margin-top-2 float-right margin-right-0"
                        disabled={res.hasErrors() || !isFormComplete}
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
