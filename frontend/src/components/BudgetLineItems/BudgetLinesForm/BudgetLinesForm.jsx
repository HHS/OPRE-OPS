import { faAdd } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import classnames from "vest/classnames";
import CanComboBox from "../../CANs/CanComboBox";
import AllServicesComponentSelect from "../../ServicesComponents/AllServicesComponentSelect";
import CurrencyInput from "../../UI/Form/CurrencyInput";
import TextArea from "../../UI/Form/TextArea/TextArea";
import DatePicker from "../../UI/USWDS/DatePicker";
import { useSelector } from "react-redux";

/**
 * @component A form for creating or editing a budget line.
 * @param {Object} props - The component props
 * @param {number} props.agreementId - The agreement ID.
 * @param {Object | null} props.selectedCan - The currently selected CAN.
 * @param {Function} props.setSelectedCan - A function to set the selected CAN.
 * @param {number | null} props.servicesComponentId - The selected services component ID.
 * @param {Function} props.setServicesComponentId - A function to set the selected services component ID.
 * @param {number | null} props.enteredAmount - The entered budget line amount.
 * @param {Function} props.setEnteredAmount - A function to set the entered budget line amount.
 * @param {string | null} props.enteredDescription - The entered budget line description.
 * @param {Function} props.setEnteredDescription - A function to set the entered budget line description.
 * @param {string | null} props.needByDate - The entered budget line need by date.
 * @param {Function} props.setNeedByDate - A function to set the entered budget line need by date.
 * @param {Function} props.handleEditBLI - A function to handle editing the budget line form.
 * @param {Function} props.handleAddBLI - A function to handle submitting the budget line form.
 * @param {Function} props.handleResetForm - A function to handle resetting the budget line form.
 * @param {boolean} props.isEditing - Whether the form is in edit mode.
 * @param {boolean} props.isReviewMode - Whether the form is in review mode.
 * @param {import('vest').Suite<any, any>} props.budgetFormSuite - The budget form validation suite.
 * @param {import('vest').Suite<any, any>} props.datePickerSuite - The date picker validation suite.
 * @param {boolean} props.isBudgetLineNotDraft - Whether the budget line is not in draft mode.
 * @returns {React.ReactElement} - The rendered component.
 */
export const BudgetLinesForm = ({
    agreementId,
    selectedCan,
    setSelectedCan,
    servicesComponentId,
    setServicesComponentId,
    enteredAmount,
    setEnteredAmount,
    enteredDescription,
    setEnteredDescription,
    needByDate,
    setNeedByDate,
    handleEditBLI = () => {},
    handleAddBLI = () => {},
    handleResetForm = () => {},
    isEditing,
    isReviewMode,
    budgetFormSuite,
    datePickerSuite,
    isBudgetLineNotDraft = false
}) => {
    const userRoles = useSelector((state) => state.auth?.activeUser?.roles) ?? [];
    let dateRes = datePickerSuite.get();

    let scCn = "success";
    let canCn = "success";
    let enteredAmountCn = "success";
    let needByDateCn = "success";

    const MemoizedDatePicker = React.memo(DatePicker);

    // validate all budget line fields if in review mode and is editing
    if (isEditing) {
        if (isReviewMode || isBudgetLineNotDraft) {
            const validationResult = budgetFormSuite(
                {
                    servicesComponentId,
                    selectedCan,
                    enteredAmount,
                    needByDate
                },
                userRoles
            );

            const budgetCn = classnames(validationResult, {
                invalid: "usa-form-group--error",
                valid: "success",
                warning: "warning"
            });

            scCn = budgetCn("allServicesComponentSelect");
            canCn = budgetCn("selectedCan");
            enteredAmountCn = budgetCn("enteredAmount");
            needByDateCn = budgetCn("needByDate");
        }
        if (!isBudgetLineNotDraft) {
            datePickerSuite(
                {
                    needByDate
                },
                userRoles
            );
        }
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
            userRoles
        );
    };

    const validateDatePicker = (name, value) => {
        datePickerSuite(
            {
                needByDate,
                ...{ [name]: value }
            },
            userRoles
        );
    };

    const isFormNotValid = dateRes.hasErrors() || budgetFormSuite.hasErrors();

    return (
        <form
            className="grid-row grid-gap margin-y-3"
            id="budget-line-form"
        >
            <div className="grid-col-4 padding-top-3">
                <div className="usa-form-group">
                    <AllServicesComponentSelect
                        agreementId={agreementId}
                        messages={budgetFormSuite.getErrors("allServicesComponentSelect")}
                        className={scCn}
                        value={servicesComponentId || ""}
                        onChange={(name, value) => {
                            if (isReviewMode) {
                                validateBudgetForm("servicesComponentId", +value);
                            }
                            setServicesComponentId(+value);
                        }}
                    />
                </div>
                <div className="usa-form-group padding-top-105">
                    <CanComboBox
                        name="selectedCan"
                        label="CAN"
                        messages={budgetFormSuite.getErrors("selectedCan")}
                        className={canCn}
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
                        ...(budgetFormSuite.getErrors("needByDate") || []),
                        ...(dateRes.getErrors("needByDate") || [])
                    ]}
                    className={needByDateCn}
                    value={needByDate}
                    onChange={(e) => {
                        setNeedByDate(e.target.value);
                        if (isReviewMode) {
                            validateBudgetForm("needByDate", e.target.value);
                        } else {
                            validateDatePicker("needByDate", e.target.value);
                        }
                    }}
                />
                <CurrencyInput
                    name="enteredAmount"
                    label="Amount"
                    messages={budgetFormSuite.getErrors("enteredAmount")}
                    className={enteredAmountCn}
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
                    name="enteredDescription"
                    label="Description (optional)"
                    value={enteredDescription || ""}
                    maxLength={150}
                    onChange={(name, value) => {
                        setEnteredDescription(value);
                    }}
                    textAreaStyle={{ height: "9rem" }}
                />

                {isEditing ? (
                    <div className="display-flex flex-justify-end">
                        <button
                            className="usa-button usa-button--unstyled margin-top-2 margin-right-2"
                            onClick={(e) => {
                                e.preventDefault();
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
