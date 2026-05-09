import Card from "../../UI/Cards/Card";
import LineBar from "../../UI/DataViz/LineBar/LineBar";
import { buildFYChartData } from "./ProjectFundingByFYCard.helpers";

/**
 * Half-width card showing project funding totals for the last 5 fiscal years
 * relative to the selected FY. Follows the same pattern as CANBudgetByFYCard.
 *
 * @component
 * @param {Object} props
 * @param {Array<{fiscal_year: number, amount: number}>} props.fundingByFiscalYear
 * @param {number} props.fiscalYear - Selected fiscal year
 * @returns {JSX.Element}
 */
const ProjectFundingByFYCard = ({ fundingByFiscalYear, fiscalYear }) => {
    const chartData = buildFYChartData(fundingByFiscalYear, fiscalYear);

    return (
        <Card
            title="Project Funding By FY"
            dataCy="project-funding-by-fy-card"
        >
            {chartData.map((item, i) => (
                <LineBar
                    key={`funding-fy-${item.FY}`}
                    iterator={i}
                    color={item.color}
                    ratio={item.ratio}
                    title={`FY ${item.FY}`}
                    total={item.total}
                />
            ))}
        </Card>
    );
};

export default ProjectFundingByFYCard;
