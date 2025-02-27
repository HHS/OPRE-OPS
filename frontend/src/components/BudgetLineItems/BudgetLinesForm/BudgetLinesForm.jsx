import { faAdd } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import classnames from "vest/classnames";
import CanComboBox from "../../CANs/CanComboBox";
import AllServicesComponentSelect from "../../ServicesComponents/AllServicesComponentSelect";
import CurrencyInput from "../../UI/Form/CurrencyInput";
import TextArea from "../../UI/Form/TextArea/TextArea";
import DatePicker from "../../UI/USWDS/DatePicker";

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
 * @param {Object} props.budgetFormSuite - The budget form suite.
 * @param {Object} props.datePickerSuite - The date picker suite.
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
    budgetFormSuite,
    datePickerSuite,
    isBudgetLineNotDraft = false
}) => {
    let budgetFormRes = budgetFormSuite.get();
    let dateRes = datePickerSuite.get();

    const budgetCn = classnames(budgetFormSuite.get(), {
        invalid: "usa-form-group--error",
        valid: "success",
        warning: "warning"
    });

    const dateCn = classnames(datePickerSuite.get(), {
        invalid: "usa-form-group--error",
        valid: "success",
        warning: "warning"
    });

    // Combined classnames for date picker that needs both validations
    const combinedDateCn = (fieldName) => {
        const budgetClass = budgetCn(fieldName);
        const dateClass = dateCn(fieldName);

        // If either has the error class, prioritize that
        if (budgetClass.includes("usa-form-group--error") || dateClass.includes("usa-form-group--error")) {
            return "usa-form-group--error";
        }
        // If either has warning, use that next
        if (budgetClass.includes("warning") || dateClass.includes("warning")) {
            return "warning";
        }
        // If both are valid, return success
        if (budgetClass.includes("success") && dateClass.includes("success")) {
            return "success";
        }

        // Default case
        return "";
    };

    const MemoizedDatePicker = React.memo(DatePicker);

    // validate all budget line fields if in review mode and is editing
    if ((isReviewMode && isEditing) || (isEditing && isBudgetLineNotDraft)) {
        budgetFormSuite({
            servicesComponentId,
            selectedCan,
            enteredAmount,
            needByDate
        });

        datePickerSuite({
            needByDate
        });
    }

    const validateBudgetForm = (name, value) => {
        budgetFormSuite(
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
        dateRes.hasErrors() ||
        (isReviewMode && (budgetFormRes.hasErrors() || !isFormComplete)) ||
        (isEditMode && isBudgetLineNotDraft && budgetFormRes.hasErrors());

    return (
        <form className="grid-row grid-gap margin-y-3">
            <div className="grid-col-4 padding-top-3">
                <div className="usa-form-group">
                    <AllServicesComponentSelect
                        agreementId={agreementId}
                        messages={budgetFormRes.getErrors("allServicesComponentSelect")}
                        className={budgetCn("allServicesComponentSelect")}
                        value={servicesComponentId || ""}
                        onChange={(name, value) => {
                            if (isReviewMode) {
                                validateBudgetForm("allServicesComponentSelect", value);
                            }
                            setServicesComponentId(+value);
                        }}
                    />
                </div>
                <div className="usa-form-group padding-top-105">
                    <CanComboBox
                        name="selectedCan"
                        label="CAN"
                        messages={budgetFormRes.getErrors("selectedCan")}
                        className={budgetCn("selectedCan")}
                        selectedCan={selectedCan}
                        setSelectedCan={setSelectedCan}
                        onChange={(name, value) => {
                            if (isReviewMode) {
                                validateBudgetForm(name, value);
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
                    messages={[
                        ...(budgetFormRes.getErrors("needByDate") || []),
                        ...(dateRes.getErrors("needByDate") || [])
                    ]}
                    className={combinedDateCn("needByDate")}
                    value={needByDate}
                    onChange={(e) => {
                        setNeedByDate(e.target.value);
                        if (isReviewMode) {
                            validateBudgetForm("needByDate", e.target.value);
                        } else {
                            // Run validateDatePicker for creating and editing
                            validateDatePicker("needByDate", e.target.value);
                        }
                    }}
                />
                <CurrencyInput
                    name="enteredAmount"
                    label="Amount"
                    messages={budgetFormRes.getErrors("enteredAmount")}
                    className={budgetCn("enteredAmount")}
                    value={enteredAmount || ""}
                    setEnteredAmount={setEnteredAmount}
                    onChange={(name, value) => {
                        if (isReviewMode) {
                            validateBudgetForm(name, value);
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
                                budgetFormSuite.reset();
                                handleResetForm();
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

export default BudgetLinesForm;
