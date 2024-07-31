import React from "react";
import PropTypes from "prop-types";
import classnames from "vest/classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAdd } from "@fortawesome/free-solid-svg-icons";
import CanComboBox from "../../CANs/CanComboBox";
import TextArea from "../../UI/Form/TextArea/TextArea";
import CurrencyInput from "../../UI/CurrencyInput";
import AllServicesComponentSelect from "../../ServicesComponents/AllServicesComponentSelect";
import DatePicker from "../../UI/USWDS/DatePicker";
import suite from "./suite";
import datePickerSuite from "./datePickerSuite";

/**
 * A form for creating or editing a budget line.
 * @component
 * @param {Object} props - The component props
 * @param {number} props.agreementId - The agreement ID.
 * @param {Object | null} props.selectedCan - The currently selected CAN.
 * @param {function} props.setSelectedCan - A function to set the selected CAN.
 * @param {number | null} props.servicesComponentId - The selected services component ID.
 * @param {function} props.setServicesComponentId - A function to set the selected services component ID.
 * @param {number | null} props.enteredAmount - The entered budget line amount.
 * @param {function} props.setEnteredAmount - A function to set the entered budget line amount.
 * @param {string | null} props.enteredComments - The entered budget line comments.
 * @param {function} props.setEnteredComments - A function to set the entered budget line comments.
 * @param {string | null} props.needByDate - The entered budget line need by date.
 * @param {function} props.setNeedByDate - A function to set the entered budget line need by date.
 * @param {function} props.handleEditBLI - A function to handle editing the budget line form.
 * @param {function} props.handleAddBLI - A function to handle submitting the budget line form.
 * @param {function} props.handleResetForm - A function to handle resetting the budget line form.
 * @param {boolean} props.isEditing - Whether the form is in edit mode.
 * @param {boolean} props.isReviewMode - Whether the form is in review mode.
 * @param {boolean} props.isEditMode - Whether the form is in edit mode.
 * @param {boolean} props.isBudgetLineNotDraft - Whether the budget line is not in draft mode.
 * @returns {JSX.Element} - The rendered component.
 */
export const BudgetLinesForm = ({
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
    isEditMode,
    isBudgetLineNotDraft = false
}) => {
    let res = suite.get();
    let dateRes = datePickerSuite.get();

    const cn = classnames(suite.get(), {
        invalid: "usa-form-group--error",
        valid: "success",
        warning: "warning"
    });
    const MemoizedDatePicker = React.memo(DatePicker);

    // validate all budget line fields if in review mode and is editing
    if ((isReviewMode && isEditing) || (isEditing && isBudgetLineNotDraft)) {
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

    const isFormComplete = selectedCan && servicesComponentId && enteredAmount && needByDate;
    const isFormNotValid =
        (isEditMode && dateRes.hasErrors()) ||
        (isReviewMode && (res.hasErrors() || !isFormComplete)) ||
        (isEditMode && isBudgetLineNotDraft && res.hasErrors());

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
                <MemoizedDatePicker
                    id="need-by-date"
                    name="needByDate"
                    label="Obligate by Date"
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
                    textAreaStyle={{ height: "9rem" }}
                />

                {isEditing ? (
                    <div className="display-flex flex-justify-end">
                        <button
                            className="usa-button usa-button--unstyled margin-top-2 margin-right-2"
                            onClick={(e) => {
                                e.preventDefault();
                                datePickerSuite.reset();
                                handleResetForm();
                                suite.reset();
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

BudgetLinesForm.propTypes = {
    agreementId: PropTypes.number.isRequired,
    selectedCan: PropTypes.object,
    setSelectedCan: PropTypes.func.isRequired,
    servicesComponentId: PropTypes.number,
    setServicesComponentId: PropTypes.func.isRequired,
    enteredAmount: PropTypes.number,
    setEnteredAmount: PropTypes.func.isRequired,
    enteredComments: PropTypes.string,
    setEnteredComments: PropTypes.func.isRequired,
    needByDate: PropTypes.string,
    setNeedByDate: PropTypes.func.isRequired,
    handleEditBLI: PropTypes.func,
    handleAddBLI: PropTypes.func,
    handleResetForm: PropTypes.func,
    isEditing: PropTypes.bool,
    isReviewMode: PropTypes.bool,
    isEditMode: PropTypes.bool,
    isBudgetLineNotDraft: PropTypes.bool
};

export default BudgetLinesForm;
