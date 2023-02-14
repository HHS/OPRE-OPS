import React from "react";
import { useSelector } from "react-redux";
import CurrencySummaryCard from "../../UI/CurrencySummaryCard/CurrencySummaryCard";
import CANFundingBar from "../../CANs/CANFundingBar/CANFundingBar";
import { calculatePercent } from "../../../helpers/utils";

const PortfolioFundingTotal = ({ portfolioId }) => {
    const portfolioBudget = useSelector((state) => state.portfolioBudgetSummary.portfolioBudget);
    const fiscalYear = useSelector((state) => state.portfolio.selectedFiscalYear);
    const totalFunding = portfolioBudget.total_funding?.amount;
    const carryForwardFunding = portfolioBudget.carry_over_funding?.amount || 0;
    const newFunding = portfolioBudget.total_funding?.amount - portfolioBudget.carry_over_funding?.amount;
    const headerText = `FY ${fiscalYear.value} Budget`;

    const data = [
        {
            id: 1,
            label: "Previous FYs Carry-Forward",
            value: carryForwardFunding,
            color: "#264a64",
            percent: `${calculatePercent(carryForwardFunding, totalFunding)}%`,
        },
        {
            id: 2,
            label: `FY ${fiscalYear} New Funding`,
            value: newFunding,
            color: "#a1d0be",
            percent: `${calculatePercent(newFunding, totalFunding)}%`,
        },
    ];

    const [activeId, setActiveId] = React.useState(0);

    return (
        <CurrencySummaryCard headerText={headerText} amount={portfolioBudget.total_funding.amount}>
            {/* <pre>{JSON.stringify(portfolioBudget, null, 2)}</pre> */}
            <div className="height-card-lg">
                <CANFundingBar setActiveId={setActiveId} data={data} />
            </div>
        </CurrencySummaryCard>
    );
};

export default PortfolioFundingTotal;
