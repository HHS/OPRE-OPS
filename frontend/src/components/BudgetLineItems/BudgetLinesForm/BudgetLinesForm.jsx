import React from "react";
import PropTypes from "prop-types";
import classnames from "vest/classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAdd } from "@fortawesome/free-solid-svg-icons";
import CanComboBox from "../../CANs/CanComboBox";
import TextArea from "../../UI/Form/TextArea/TextArea";
import CurrencyInput from "./CurrencyInput";
import AllServicesComponentSelect from "../../ServicesComponents/AllServicesComponentSelect";
import DatePicker from "../../UI/USWDS/DatePicker";
import suite from "./suite";
import datePickerSuite from "./datePickerSuite";

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
 * @param {boolean} props.isEditMode - Whether the form is in edit mode.
 * @param {number} props.agreementId - The agreement ID.
 * @returns {JSX.Element} - The rendered component.
 */
export const CreateBudgetLinesForm = ({
    agreementId,
    selectedCan,
    setSelectedCan,
    servicesComponentId,
    setServicesComponentId,
    enteredAmount,
    setEnteredAmount,
    enteredComments,
    setEnteredComments,
    needByDate,
    setNeedByDate,
    handleEditBLI = () => {},
    handleAddBLI = () => {},
    handleResetForm = () => {},
    isEditing,
    isReviewMode,
    isEditMode
}) => {
    let res = suite.get();
    let dateRes = datePickerSuite.get();

    const cn = classnames(suite.get(), {
        invalid: "usa-form-group--error",
        valid: "success",
        warning: "warning"
    });
    const MemoizedDatePicker = React.memo(DatePicker);

    // validate all budgetline fields if in review mode and is editing
    if (isReviewMode && isEditing) {
        suite({
            servicesComponentId,
            selectedCan,
            enteredAmount,
            needByDate
        });
    }

    const runValidate = (name, value) => {
        suite(
            {
                servicesComponentId,
                selectedCan,
                enteredAmount,
                needByDate,
                ...{ [name]: value }
            },
            name
        );
    };

    const validateDatePicker = (name, value) => {
        datePickerSuite(
            {
                needByDate,
                ...{ [name]: value }
            },
            name
        );
    };

    const datePickerValue = React.useMemo(() => needByDate, [needByDate]);
    const isFormComplete = selectedCan && servicesComponentId && enteredAmount && needByDate;
    const isFormNotValid =
        (isEditMode && dateRes.hasErrors()) || (isReviewMode && (res.hasErrors() || !isFormComplete));

    return (
        <form className="grid-row grid-gap margin-y-3">
            <div className="grid-col-4 padding-top-3">
                <div className="usa-form-group">
                    <AllServicesComponentSelect
                        agreementId={agreementId}
                        messages={res.getErrors("allServicesComponentSelect")}
                        className={cn("allServicesComponentSelect")}
                        value={servicesComponentId || ""}
                        onChange={(name, value) => {
                            if (isReviewMode) {
                                runValidate("allServicesComponentSelect", value);
                            }
                            setServicesComponentId(+value);
                        }}
                    />
                </div>
                <div className="usa-form-group padding-top-105">
                    <CanComboBox
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
                {/* <DebugCode data={{ needByDate, dateRes }} /> */}
                <MemoizedDatePicker
                    id="need-by-date"
                    name="needByDate"
                    label="Need by Date"
                    hint="mm/dd/yyyy"
                    messages={[...(res.getErrors("needByDate") || []), ...(dateRes.getErrors("needByDate") || [])]}
                    className={cn("needByDate")}
                    value={needByDate}
                    onChange={(e) => {
                        setNeedByDate(e.target.value);
                        if (isEditMode) {
                            validateDatePicker("needByDate", e.target.value);
                        }
                        if (isReviewMode) {
                            runValidate("needByDate", e.target.value);
                        }
                    }}
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
                                datePickerSuite.reset();
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
                            disabled={isFormNotValid}
                            onClick={handleEditBLI}
                        >
                            Update Budget Line
                        </button>
                    </div>
                ) : (
                    <button
                        id="add-budget-line"
                        className="usa-button usa-button--outline margin-top-2 float-right margin-right-0"
                        disabled={isFormNotValid}
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
    );
};

CreateBudgetLinesForm.propTypes = {
    agreementId: PropTypes.number,
    selectedCan: PropTypes.object,
    setSelectedCan: PropTypes.func,
    servicesComponentId: PropTypes.number,
    setServicesComponentId: PropTypes.func,
    enteredAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    setEnteredAmount: PropTypes.func,
    enteredComments: PropTypes.string,
    setEnteredComments: PropTypes.func,
    needByDate: PropTypes.string,
    setNeedByDate: PropTypes.func,
    handleEditBLI: PropTypes.func,
    handleAddBLI: PropTypes.func,
    handleResetForm: PropTypes.func,
    isEditing: PropTypes.bool,
    isReviewMode: PropTypes.bool,
    isEditMode: PropTypes.bool
};

export default CreateBudgetLinesForm;
