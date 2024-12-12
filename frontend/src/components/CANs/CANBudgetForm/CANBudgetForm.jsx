import CurrencyInput from "../../UI/Form/CurrencyInput";

/**
 * @typedef {Object} CANBudgetFormProps
 * @property {number} fiscalYear
 * @property {number} budgetAmount
 * @property {() => void} setBudgetAmount
 * @property {() => void} handleAddBudget
 */

/**
 * @component - The CAN Budget Form component.
 * @param {CANBudgetFormProps} props
 * @returns  {JSX.Element} - The component JSX.
 */
const CANBudgetForm = ({ budgetAmount, fiscalYear, handleAddBudget, setBudgetAmount }) => {
    return (
        <form
            onSubmit={(e) => {
                handleAddBudget(e);
                setBudgetAmount(0);
            }}
        >
            <CurrencyInput
                name="budget-amount"
                label={`FY ${fiscalYear} CAN Budget`}
                onChange={() => {}}
                setEnteredAmount={setBudgetAmount}
                value={budgetAmount || ""}
            />
            <button
                id="save-changes"
                className="usa-button usa-button--outline margin-top-4"
                disabled={!budgetAmount}
                data-cy="save-btn"
            >
                + Add FY Budget
            </button>
        </form>
    );
};
export default CANBudgetForm;
