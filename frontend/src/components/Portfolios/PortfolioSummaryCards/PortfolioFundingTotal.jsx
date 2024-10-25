import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import CurrencyFormat from "react-currency-format";
import { useSelector } from "react-redux";
import { calculatePercent } from "../../../helpers/utils";
import LineGraph from "../../UI/DataViz/LineGraph";
import CurrencyCard from "../../UI/Cards/CurrencyCard";
import Tag from "../../UI/Tag/Tag";

const PortfolioFundingTotal = () => {
    const portfolioBudget = useSelector((state) => state.portfolioBudgetSummary.portfolioBudget);
    const fiscalYear = useSelector((state) => state.portfolio.selectedFiscalYear);
    const totalFunding = portfolioBudget.total_funding?.amount;
    const carryForwardFunding = portfolioBudget.carry_forward_funding?.amount || 0;
    const newFunding = portfolioBudget.total_funding?.amount - portfolioBudget.carry_forward_funding?.amount;
    const headerText = `FY ${fiscalYear.value} Budget`;

    const data = [
        {
            id: 1,
            label: "Previous FYs Carry-Forward",
            value: carryForwardFunding,
            color: "#A1D0BE",
            percent: `${calculatePercent(carryForwardFunding, totalFunding)}%`,
            tagActiveStyle: "whiteOnTeal"
        },
        {
            id: 2,
            label: `FY ${fiscalYear.value} New Funding`,
            value: newFunding,
            color: "#534C9C",
            percent: `${calculatePercent(newFunding, totalFunding)}%`,
            tagActiveStyle: "whiteOnPurple"
        }
    ];
    const [activeId, setActiveId] = React.useState(0);

    const LegendItem = ({ id, label, value, color, percent, tagStyleActive }) => {
        const isGraphActive = activeId === id;
        return (
            <div className="grid-row margin-top-2 font-12px">
                <div className="grid-col-7">
                    <div className="display-flex flex-align-center">
                        <FontAwesomeIcon
                            icon={faCircle}
                            className={`height-1 width-1 margin-right-05`}
                            style={{ color: color }}
                        />

                        <span className={isGraphActive ? "fake-bold" : ""}>{label}</span>
                    </div>
                </div>
                <div className="grid-col-4">
                    <CurrencyFormat
                        value={value}
                        displayType={"text"}
                        thousandSeparator={true}
                        prefix={"$ "}
                        renderText={(value) => <span className={isGraphActive ? "fake-bold" : ""}>{value}</span>}
                    />
                </div>
                <div className="grid-col-1">
                    <Tag
                        tagStyle="darkTextWhiteBackground"
                        text={percent}
                        label={label}
                        active={isGraphActive}
                        tagStyleActive={tagStyleActive}
                    />
                </div>
            </div>
        );
    };

    return (
        <CurrencyCard
            headerText={headerText}
            amount={portfolioBudget.total_funding.amount}
        >
            <div
                id="currency-summary-card"
                className="margin-top-2"
            >
                <LineGraph
                    setActiveId={setActiveId}
                    data={data}
                />
            </div>

            {data.map((item) => (
                <LegendItem
                    key={item.id}
                    id={item.id}
                    label={item.label}
                    value={item.value}
                    color={item.color}
                    percent={item.percent}
                    tagStyleActive={item.tagActiveStyle}
                />
            ))}
        </CurrencyCard>
    );
};

export default PortfolioFundingTotal;
