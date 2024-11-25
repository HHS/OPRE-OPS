import Card from "../../../UI/Cards/Card";
import LineBar from "../../../UI/DataViz/LineBar";
import { summaryCard } from "./BLIsFYSummaryCard.helpers";

/**
 * @component Budget Lines Line Graph by Fiscal Year Card
 * @typedef {import("../../../BudgetLineItems/BudgetLineTypes").BudgetLine} BudgetLine
 * @param {Object} props - The component props.
 * @param {BudgetLine[]} props.budgetLineItems - The budget line items for the agreement.
 * @returns {JSX.Element} - The agreement total budget lines card component JSX.
 */
const BLIsByFYSummaryCard = ({ budgetLineItems = [] }) => {
    const { chartData } = summaryCard(budgetLineItems);

    return (
        <Card
            title="Budget Lines by Fiscal Year"
            dataCy="blis-by-fy-card"
        >
            <div>
                {chartData.map((item) => (
                    <LineBar
                        key={item.FY}
                        color={item.color}
                        ratio={item.ratio}
                        total={item.total}
                        title={`FY ${item.FY}`}
                    />
                ))}
            </div>
        </Card>
    );
};

export default BLIsByFYSummaryCard;
