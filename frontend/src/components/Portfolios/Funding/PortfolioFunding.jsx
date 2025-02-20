import { useOutletContext } from "react-router-dom";

import CanCard from "../../CANs/CanCard/CanCard";
import LineGraphWithLegendCard from "../../UI/Cards/LineGraphWithLegendCard";
import Card from "../../UI/Cards/Card";
import LineBar from "../../UI/DataViz/LineBar";
import { calculatePercent } from "../../../helpers/utils";

const PortfolioFunding = () => {
    const { portfolioFunding, newFunding, fiscalYear, canIds } = useOutletContext();
    const carryForward = portfolioFunding.carry_forward_funding.amount;
    const totalBudget = portfolioFunding.total_funding.amount;

    const data = [
        {
            id: 1,
            label: "Previous FYs Carry-Forward",
            value: carryForward,
            color: "var(--portfolio-carry-forward)",
            percent: `${calculatePercent(carryForward, totalBudget)}%`,
            tagActiveStyle: "portfolioCarryForward"
        },
        {
            id: 2,
            label: `FY ${fiscalYear} New Funding`,
            value: newFunding,
            color: "var(--portfolio-new-funding)",
            percent: `${calculatePercent(newFunding, totalBudget)}%`,
            tagActiveStyle: "portfolioNewFunding"
        }
    ];

    // TODO: replace this with actual data
    //const { chartData } = summaryCard(fundingBudgets);
    const chartData = [
        {
            FY: "2025",
            total: 5_000_000,
            ratio: 5_000_000 / 5_000_000,
            color: "var(--portfolio-budget-graph-1)"
        },
        {
            FY: "2024",
            total: 4_000_000,
            ratio: 4_000_000 / 5_000_000,
            color: "var(--portfolio-budget-graph-2)"
        },
        {
            FY: "2023",
            total: 3_000_000,
            ratio: 3_000_000 / 5_000_000,
            color: "var(--portfolio-budget-graph-3)"
        },
        {
            FY: "2022",
            total: 2_000_000,
            ratio: 2_000_000 / 5_000_000,
            color: "var(--portfolio-budget-graph-4)"
        },
        {
            FY: "2021",
            total: 1_000_000,
            ratio: 1_000_000 / 5_000_000,
            color: "var(--portfolio-budget-graph-5)"
        }
    ];

    return (
        <>
            <section>
                <h2 className="font-sans-lg">Portfolio Funding Summary</h2>
                <p className="font-sans-sm">
                    The summary below shows the funding for this Portfolio’s CANs for the selected fiscal year.
                </p>

                <div className="display-flex flex-justify">
                    <LineGraphWithLegendCard
                        heading={`FY ${fiscalYear} Portfolio Total Budget`}
                        data={data}
                        bigNumber={portfolioFunding.total_funding.amount}
                    />
                    <Card title="Portfolio Budget by FY" dataCy="portfolio-budget-card">
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
                </div>
            </section>
            <section>
                <h2 className="font-sans-lg">Portfolio Budget by CAN </h2>
                <p className="font-sans-sm">
                    The summary below shows the funding for this Portfolio’s CANs for the selected fiscal year. Received
                    means the funding has been received by OPRE. Spending equals the sum of Budget Lines in Planned,
                    Executing and Obligated Status.
                </p>
                {canIds.map((canId) => (
                    <CanCard
                        key={canId}
                        canId={canId}
                        fiscalYear={fiscalYear}
                    />
                ))}
            </section>
        </>
    );
};

export default PortfolioFunding;
