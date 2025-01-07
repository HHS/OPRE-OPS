import CurrencyInput from "../../UI/Form/CurrencyInput";
import icons from "../../../uswds/img/sprite.svg";

/**
 * @typedef {Object} CANBudgetFormProps
 * @property {string} budgetAmount
 * @property {(arg: string) => string} cn
 * @property {Object} res
 * @property {number} fiscalYear
 * @property {(e: React.FormEvent<HTMLFormElement>) => void} handleAddBudget
 * @property {(name: string, value: string) => void} runValidate
 * @property { React.Dispatch<React.SetStateAction<string>>} setBudgetAmount
 */

/**
 * @component - The CAN Budget Form component.
 * @param {CANBudgetFormProps} props
 * @returns  {JSX.Element} - The component JSX.
 */
const CANBudgetForm = ({ budgetAmount, cn, res, fiscalYear, handleAddBudget, runValidate, setBudgetAmount }) => {
    const fillColor = budgetAmount ? "#005ea2" : "#757575";

    return (
        <form
            onSubmit={(e) => {
                handleAddBudget(e);
            }}
        >
            <div style={{ width: "383px" }}>
                <CurrencyInput
                    name="budget-amount"
                    label={`FY ${fiscalYear} CAN Budget`}
                    onChange={(name, value) => {
                        runValidate("budget-amount", value);
                    }}
                    setEnteredAmount={setBudgetAmount}
                    value={budgetAmount || ""}
                    messages={res.getErrors("budget-amount")}
                    className={cn("budget-amount")}
                />
            </div>
            <button
                id="add-fy-budget"
                className="usa-button usa-button--outline margin-top-4"
                disabled={!budgetAmount}
                data-cy="add-fy-budget"
            >
                <svg
                    className="height-2 width-2 margin-right-05 cursor-pointer"
                    style={{ fill: fillColor }}
                >
                    <use xlinkHref={`${icons}#add`}></use>
                </svg>
                Add FY Budget
            </button>
        </form>
    );
};
export default CANBudgetForm;
