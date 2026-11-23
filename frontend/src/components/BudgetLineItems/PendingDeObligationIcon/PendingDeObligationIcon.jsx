import deObligationIcon from "../../../images/de-obligation-icon.svg";
import { formatCurrency } from "../../../helpers/currencyFormat.helpers";
import Tooltip from "../../UI/USWDS/Tooltip";

/**
 * The "D" badge next to an amount that has a pending de-obligation (OPS-6488).
 * @param {Object} props
 * @param {import("../../../types/BudgetLineTypes").BudgetLine} props.budgetLine
 * @returns {React.ReactElement | null}
 */
const PendingDeObligationIcon = ({ budgetLine }) => {
    const pendingAmount = budgetLine?.requested_de_obligation_amount;
    if (pendingAmount == null) {
        return null;
    }
    return (
        <Tooltip
            position="right"
            label={`Original obligated amount was ${formatCurrency(budgetLine.amount)} with ${formatCurrency(
                pendingAmount
            )} de-obligated in a modification`}
        >
            <img
                src={deObligationIcon}
                width={16}
                height={16}
                alt="Pending de-obligation"
                className="margin-left-1 text-middle"
                data-testid="pending-de-obligation-icon"
            />
        </Tooltip>
    );
};

export default PendingDeObligationIcon;
