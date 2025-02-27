import Card from "../../UI/Cards/Card";
import LineBar from "../../UI/DataViz/LineBar";
import { summaryCard } from "./CANBudgetByFYCard.helpers";

/**
 *  @typedef {import("../../../components/CANs/CANTypes").FundingBudget} FundingBudget
 */

/**
 * @typedef {Object} CANBudgetByFYCard
 * @property {FundingBudget[]} fundingBudgets
 * @property {string} fiscalYear
 */

/**
 * @component - The CAN Budget by Fiscal Year Card
 * @param {CANBudgetByFYCard} props
 * @returns  {JSX.Element} - The component JSX.
 */
const CANBudgetByFYCard = ({ fundingBudgets, fiscalYear }) => {
    const { chartData } = summaryCard(fundingBudgets, fiscalYear);

    return (
        <>
            <Card
                title="CAN Budget by FY"
                dataCy="can-budget-fy-card"
            >
                {chartData.map((item, i) => (
                    <LineBar
                        key={`budget-fy-${item.FY}`}
                        iterator={i}
                        color={item.color}
                        ratio={item.ratio}
                        title={`FY ${item.FY}`}
                        total={item.total}
                    />
                ))}
            </Card>
        </>
    );
};

export default CANBudgetByFYCard;
