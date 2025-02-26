import React, { useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useLazyGetPortfolioFundingSummaryQuery } from "../../../api/opsAPI";
import { calculatePercent } from "../../../helpers/utils";
import CanCard from "../../CANs/CanCard/CanCard";
import Card from "../../UI/Cards/Card";
import LineGraphWithLegendCard from "../../UI/Cards/LineGraphWithLegendCard";
import LineBar from "../../UI/DataViz/LineBar";

const PortfolioFunding = () => {
    const [fyBudgetChartData, setFyBudgetChartData] = React.useState([]);
    const { portfolioId, portfolioFunding, newFunding, fiscalYear, canIds } = useOutletContext();
    const carryForward = portfolioFunding.carry_forward_funding.amount;
    const totalBudget = portfolioFunding.total_funding.amount;

    const [trigger] = useLazyGetPortfolioFundingSummaryQuery();
    const fetchPortfolioFunding = async () => {
        const lastFiveYears = Array.from({ length: 5 }, (_, i) => +fiscalYear - i);
        const promises = lastFiveYears.map((year) => {
            return trigger({ portfolioId, fiscalYear: year }).unwrap();
        });

        try {
            const portfolioFundingSummaries = await Promise.all(promises);
            const newFyBudgetChartData = portfolioFundingSummaries.map((summary) => summary?.total_funding.amount);
            setFyBudgetChartData(newFyBudgetChartData);
        } catch (error) {
            console.error("Failed to fetch portfolio funding:", error);
        }
    };

    useEffect(() => {
        setFyBudgetChartData([]);
        if (portfolioId) {
            fetchPortfolioFunding();
        }
    }, [portfolioId, fiscalYear]);

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

    const maxBudget = Math.max(...fyBudgetChartData) === 0 ? 1 : Math.max(...fyBudgetChartData);
    const chartData = [
        {
            FY: `${+fiscalYear}`,
            total: fyBudgetChartData[0],
            ratio: fyBudgetChartData[0] / maxBudget,
            color: "var(--portfolio-budget-graph-1)"
        },
        {
            FY: `${+fiscalYear - 1}`,
            total: fyBudgetChartData[1],
            ratio: fyBudgetChartData[1] / maxBudget,
            color: "var(--portfolio-budget-graph-2)"
        },
        {
            FY: `${+fiscalYear - 2}`,
            total: fyBudgetChartData[2],
            ratio: fyBudgetChartData[2] / maxBudget,
            color: "var(--portfolio-budget-graph-3)"
        },
        {
            FY: `${+fiscalYear - 3}`,
            total: fyBudgetChartData[3],
            ratio: fyBudgetChartData[3] / maxBudget,
            color: "var(--portfolio-budget-graph-4)"
        },
        {
            FY: `${+fiscalYear - 4}`,
            total: fyBudgetChartData[4],
            ratio: fyBudgetChartData[4] / maxBudget,
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
                    <Card
                        title="Portfolio Budget by FY"
                        dataCy="portfolio-budget-card"
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
                </div>
            </section>
            <section>
                <h2 className="font-sans-lg">Portfolio Budget by CAN </h2>
                <p className="font-sans-sm">
                    The summary below shows the funding for this Portfolio’s CANs for the selected fiscal year. Received
                    means the funding has been received by OPRE. Spending equals the sum of Budget Lines in Planned,
                    Executing and Obligated Status.
                </p>
                {canIds.length === 0 ? (
                    <p className="text-center">No CANs found for this Portfolio.</p>
                ) : (
                    canIds.map((canId) => (
                        <CanCard
                            key={canId}
                            canId={canId}
                            fiscalYear={fiscalYear}
                        />
                    ))
                )}
            </section>
        </>
    );
};

export default PortfolioFunding;
