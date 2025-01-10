import DebugCode from "../../DebugCode";
import Card from "../../UI/Cards/Card";
import LineBar from "../../UI/DataViz/LineBar";
import { summaryCard } from "./CANBudgetByFYCard.helpers";

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

    return (
        <>
            <Card
                title="CAN Budget by FY"
                dataCy="can-budget-fy-card"
            >
                {chartData.map((item) => (
                    <LineBar
                        key={`budget-fy-${item.FY}`}
                        color={item.color}
                        ratio={item.ratio}
                        title={`FY ${item.FY}`}
                        total={item.total}
                    />
                ))}
                <DebugCode data={chartData} />
            </Card>
        </>
    );
};

export default CANBudgetByFYCard;
