import PropTypes from "prop-types";
import classnames from "vest/classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAdd } from "@fortawesome/free-solid-svg-icons";
import CanSelect from "../../CANs/CanSelect";
// import DesiredAwardDate from "../../UI/Form/DesiredAwardDate";
import suite from "./suite";
import TextArea from "../../UI/Form/TextArea/TextArea";
import CurrencyInput from "./CurrencyInput";
import AllServicesComponentSelect from "../../ServicesComponents/AllServicesComponentSelect";
import DatePicker from "../../UI/USWDS/DatePicker";
import DebugCode from "../../DebugCode";

/**
 * A form for creating or editing a budget line.
 * @component
 * @param {Object} props - The component props.
 * @param {Object} props.selectedCan - The currently selected CAN.
 * @param {number} props.servicesComponentId - The selected services component ID.
 * @param {number} props.enteredAmount - The entered budget line amount.
 * @param {string|number} props.enteredMonth - The entered budget line desired award month.
 * @param {string|number} props.enteredDay - The entered budget line desired award day.
 * @param {string|number} props.enteredYear - The entered budget line desired award year.
 * @param {string} props.enteredComments - The entered budget line comments.
 * @param {boolean} props.isEditing - Whether the form is in edit mode.
 * @param {function} props.setServicesComponentId - A function to set the selected services component ID.
 * @param {function} props.setSelectedCan - A function to set the selected CAN.
 * @param {function} props.setEnteredAmount - A function to set the entered budget line amount.
 * @param {string} props.needByDate - The entered budget line need by date.
 * @param {function} props.setNeedByDate - A function to set the entered budget line need by date.
 * @param {function} props.setEnteredComments - A function to set the entered budget line comments.
 * @param {function} props.handleEditBLI - A function to handle editing the budget line form.
 * @param {function} props.handleAddBLI - A function to handle submitting the budget line form.
 * @param {function} props.handleResetForm - A function to handle resetting the budget line form.
 * @param {boolean} props.isReviewMode - Whether the form is in review mode.
 * @param {number} props.agreementId - The agreement ID.
 * @returns {JSX.Element} - The rendered component.
 */
export const CreateBudgetLinesForm = ({
    selectedCan,
    servicesComponentId,
    enteredAmount,
    // enteredMonth,
    // enteredDay,
    // enteredYear,
    enteredComments,
    isEditing,
    setServicesComponentId,
    setSelectedCan,
    setEnteredAmount,
    // setEnteredMonth,
    // setEnteredDay,
    // setEnteredYear,
    needByDate,
    setNeedByDate,
    setEnteredComments,
    handleEditBLI = () => {},
    handleAddBLI = () => {},
    handleResetForm = () => {},
    isReviewMode,
    agreementId
}) => {
    let res = suite.get();

    const cn = classnames(suite.get(), {
        invalid: "usa-form-group--error",
        valid: "success",
        warning: "warning"
    });
    const isFormComplete = selectedCan && servicesComponentId && enteredAmount && needByDate;

    // validate all budgetline fields if in review mode and is editing
    //TODO: update suite for Services Components
    if (isReviewMode && isEditing) {
        suite({
            selectedCan,
            enteredAmount
            // enteredMonth,
            // enteredDay,
            // enteredYear
        });
    }

    const runValidate = (name, value) => {
        suite(
            {
                selectedCan,
                enteredAmount,
                // enteredMonth,
                // enteredDay,
                // enteredYear,
                ...{ [name]: value }
            },
            name
        );
    };

    return (
        <>
            <DebugCode
                data={{
                    servicesComponentId,
                    selectedCan,
                    enteredAmount,
                    enteredComments,
                    needByDate
                }}
            />
            <form className="grid-row grid-gap margin-y-3">
                <div className="grid-col-4">
                    <div className="usa-form-group">
                        <AllServicesComponentSelect
                            agreementId={agreementId}
                            value={servicesComponentId || ""}
                            onChange={(name, value) => {
                                setServicesComponentId(+value);
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
                    <div className="usa-form-group">
                        {/* <label
                            className="usa-label"
                            htmlFor="need-by-date"
                            id="need-by-date-label"
                        >
                            Need By Date
                        </label>
                        <div
                            className="usa-hint"
                            id="need-by-date-hint"
                        >
                            mm/dd/yyyy
                        </div> */}
                        <DatePicker
                            id="need-by-date"
                            name="need-by-date"
                            aria-describedby="need-by-date-hint"
                            aria-labelledby="need-by-date-label"
                            value={needByDate}
                            // value={needByDate}
                            onChange={(e) => {
                                setNeedByDate(e.target.value);
                            }}
                            // onBlur={(date) => {
                            //     setNeedByDate(date);
                            // }}
                        />
                    </div>
                    {/* <DesiredAwardDate
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
                /> */}
                    <CurrencyInput
                        name="enteredAmount"
                        label="Amount"
                        messages={res.getErrors("enteredAmount")}
                        className={cn("enteredAmount")}
                        value={enteredAmount ?? ""}
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
                        maxLength={150}
                        onChange={(name, value) => {
                            setEnteredComments(value);
                        }}
                    />

                    {isEditing ? (
                        <div className="display-flex flex-justify-end">
                            <button
                                className="usa-button usa-button--unstyled margin-top-2 margin-right-2"
                                onClick={(e) => {
                                    e.preventDefault();
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
                                disabled={isReviewMode && (res.hasErrors() || !isFormComplete)}
                                onClick={handleEditBLI}
                            >
                                Update Budget Line
                            </button>
                        </div>
                    ) : (
                        <button
                            id="add-budget-line"
                            className="usa-button usa-button--outline margin-top-2 float-right margin-right-0"
                            disabled={isReviewMode && (res.hasErrors() || !isFormComplete)}
                            onClick={handleAddBLI}
                        >
                            <FontAwesomeIcon
                                icon={faAdd}
                                className="height-2 width-2"
                            />
                            Add Budget Line
                        </button>
                    )}
                </div>
            </form>
        </>
    );
};

CreateBudgetLinesForm.propTypes = {
    selectedCan: PropTypes.object,
    servicesComponentId: PropTypes.number,
    enteredAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    enteredMonth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    enteredDay: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    enteredYear: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    enteredComments: PropTypes.string,
    isEditing: PropTypes.bool,
    setServicesComponentId: PropTypes.func,
    setSelectedCan: PropTypes.func,
    setEnteredAmount: PropTypes.func,
    needByDate: PropTypes.string,
    setNeedByDate: PropTypes.func,
    setEnteredComments: PropTypes.func,
    handleAddBLI: PropTypes.func,
    handleEditBLI: PropTypes.func,
    handleResetForm: PropTypes.func,
    isReviewMode: PropTypes.bool,
    agreementId: PropTypes.number
};

export default CreateBudgetLinesForm;
