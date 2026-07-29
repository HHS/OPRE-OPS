import icons from "../../../uswds/img/sprite.svg";
import CurrencyInput from "../../UI/Form/CurrencyInput";

/**
 * @typedef {Object} CANBudgetFormProps
 * @property {boolean} showCarryForwardCard
 * @property {number} totalFunding
 * @property {number} budgetAmount
 * @property {(arg: string) => string} cn
 * @property {Object} res
 * @property {number} fiscalYear
 * @property {() => void} handleAddBudget
 * @property {(name: string, value: string) => { hasErrors: (name: string) => boolean }} runValidate
 * @property {(name: string) => void} clearValidationError
 * @property {(value: string) => void} setBudgetAmount
 */

/**
 * @component - The CAN Budget Form component.
 * @param {CANBudgetFormProps} props
 * @returns {React.ReactElement} - The component JSX.
 */
const CANBudgetForm = ({
    totalFunding,
    showCarryForwardCard,
    budgetAmount,
    cn,
    res,
    fiscalYear,
    handleAddBudget,
    runValidate,
    clearValidationError,
    setBudgetAmount
}) => {
    const buttonText = totalFunding ? "Update FY Budget" : "Add FY Budget";

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                const result = runValidate("budget-amount", String(budgetAmount ?? ""));
                if (!result.hasErrors("budget-amount")) {
                    handleAddBudget();
                }
            }}
        >
            <div style={{ width: "383px", marginTop: `${showCarryForwardCard ? "0" : "-24px"}` }}>
                <CurrencyInput
                    name="budget-amount"
                    label={`FY ${fiscalYear} CAN Budget`}
                    onChange={() => {
                        clearValidationError("budget-amount");
                    }}
                    setEnteredAmount={setBudgetAmount}
                    value={budgetAmount ?? ""}
                    messages={res.getErrors("budget-amount")}
                    className={cn("budget-amount")}
                    onBlur={(e) => {
                        runValidate("budget-amount", e.target.value);
                    }}
                />
            </div>
            <button
                id="add-fy-budget"
                className="usa-button usa-button--outline margin-top-4"
                data-cy="add-fy-budget"
            >
                {!totalFunding ? (
                    <svg
                        className="height-2 width-2 margin-right-05 cursor-pointer"
                        style={{ fill: "#005ea2" }}
                    >
                        <use href={`${icons}#add`}></use>
                    </svg>
                ) : null}
                {buttonText}
            </button>
        </form>
    );
};
export default CANBudgetForm;
