import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";
import CurrencyFormat from "react-currency-format";
import CurrencySummaryCard from "../../UI/CurrencySummaryCard/CurrencySummaryCard";
import CANFundingBar from "../../CANs/CANFundingBar/CANFundingBar";
import { calculatePercent } from "../../../helpers/utils";
import Tag from "../../UI/Tag/Tag";
import { getResearchFunding } from "./getResearchProjectsFunding.js";
import { setResearchProjectFundingDetails } from "./ResearchProjectFundingSlice";

const ResearchBudgetVsSpending = ({ portfolioId = 0 }) => {
    const dispatch = useDispatch();
    const portfolioBudget = useSelector((state) => state.portfolioBudgetSummary.portfolioBudget);
    const fiscalYear = useSelector((state) => state.portfolio.selectedFiscalYear);
    const researchProjectFunding = useSelector((state) => state.researchProjectFunding.researchProjectFundingDetails);
    const totalFunding = researchProjectFunding?.total_funding?.toString() || "0.00";
    const carryForwardFunding = portfolioBudget.carry_over_funding?.amount || 0;
    const newFunding = portfolioBudget.total_funding?.amount - portfolioBudget.carry_over_funding?.amount;
    const headerText = `FY ${fiscalYear.value} Budget vs Spending`;

    React.useEffect(() => {
        const getResearchProjectsFundingAndSetState = async () => {
            const result = await getResearchFunding(portfolioId, fiscalYear.value);
            dispatch(setResearchProjectFundingDetails(result));
        };

        getResearchProjectsFundingAndSetState().catch(console.error);

        return () => {
            dispatch(setResearchProjectFundingDetails({}));
        };
    }, [dispatch, fiscalYear, portfolioId]);

    // portfolioCansFundingDetails
    const data = [
        {
            id: 1,
            label: `FY ${fiscalYear.value} Total Spending`,
            value: "8000000.00",
            color: "#B6406C",
            percent: `${calculatePercent("8000000.00", totalFunding)}%`,
        },
        {
            id: 2,
            label: `FY ${fiscalYear.value} Remaining Budget`,
            value: "2000000.00",
            color: "#A9AEB1 ",
            percent: `${calculatePercent("2000000.00", totalFunding)}%`,
        },
    ];
    const [activeId, setActiveId] = React.useState(0);

    const LegendItem = ({ id, label, value, color, percent }) => {
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

                        <span className={isGraphActive ? "fake-bold" : undefined}>{label}</span>
                    </div>
                </div>
                <div className="grid-col-4">
                    <CurrencyFormat
                        value={value}
                        displayType={"text"}
                        thousandSeparator={true}
                        prefix={"$ "}
                        renderText={(value) => <span className={isGraphActive ? "fake-bold" : undefined}>{value}</span>}
                    />
                </div>
                <div className="grid-col-1">
                    <Tag tagStyle="darkTextWhiteBackground" text={percent} label={label} active={isGraphActive} />
                </div>
            </div>
        );
    };

    return (
        <CurrencySummaryCard headerText={headerText} amount={totalFunding}>
            {/* <pre>{JSON.stringify(portfolioBudget, null, 2)}</pre> */}
            <div id="currency-summary-card" className="margin-top-2">
                <CANFundingBar setActiveId={setActiveId} data={data} />
            </div>

            {data.map((item) => (
                <LegendItem
                    key={item.id}
                    id={item.id}
                    label={item.label}
                    value={item.value}
                    color={item.color}
                    percent={item.percent}
                />
            ))}
        </CurrencySummaryCard>
    );
};

export default ResearchBudgetVsSpending;
