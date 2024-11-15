import CurrencyFormat from "react-currency-format";
import DebugCode from "../../DebugCode";
import Card from "../../UI/Cards/Card";
import { summaryCard } from "./CANBudgetByFYCard.helpers";
import { getDecimalScale } from "../../../helpers/currencyFormat.helpers";
import styles from "./CANBudgetByFYCard.styles.module.css";
/**
 *  @typedef {import("../../../components/CANs/CANTypes").FundingBudget} FundingBudget
 */

/**
 * @typedef {Object} CANBudgetByFYCard
 * @property {FundingBudget[]} fundingBudgets
 */

/**
 * @component - The CAN Budget by Fiscal Year Card
 * @param {CANBudgetByFYCard} props
 * @returns  {JSX.Element} - The component JSX.
 */
const CANBudgetByFYCard = ({ fundingBudgets }) => {
    const { chartData } = summaryCard(fundingBudgets);
    const id = crypto.randomUUID();

    return (
        <Card
            title="CAN Budget by FY"
            id="can-budget-fy-card"
        >
            {chartData.map((item, index) => (
                <div
                    className="display-flex margin-y-105 font-12px"
                    key={`budget-fy-${index}-${id}`}
                >
                    <span>FY {item.FY}</span>
                    <div
                        className="margin-x-1"
                        style={{ flex: item.ratio }}
                    >
                        <div
                            className={styles.bar}
                            style={{ backgroundColor: item.color }}
                        />
                    </div>
                    <CurrencyFormat
                        value={item.total}
                        displayType="text"
                        thousandSeparator=","
                        prefix="$"
                        decimalScale={getDecimalScale(item.total)}
                        fixedDecimalScale={true}
                    />
                </div>
            ))}
            <DebugCode data={chartData} />
        </Card>
    );
};

export default CANBudgetByFYCard;
