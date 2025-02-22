import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import CurrencyFormat from "react-currency-format";
import { useDispatch, useSelector } from "react-redux";
import { calculatePercent } from "../../../helpers/utils";
import LineGraph from "../../UI/DataViz/LineGraph";
import CurrencyCard from "../../UI/Cards/CurrencyCard";
import Tag from "../../UI/Tag/Tag";
import { getResearchFunding } from "./getResearchProjectsFunding.js";
import { setResearchProjectFundingDetails } from "./ResearchProjectFundingSlice";

const ResearchBudgetVsSpending = ({ portfolioId = 0 }) => {
    const dispatch = useDispatch();
    const fiscalYear = useSelector((state) => state.portfolio.selectedFiscalYear);
    const researchProjectFunding = useSelector((state) => state.researchProjectFunding.researchProjectFundingDetails);
    const totalFunding = researchProjectFunding?.total_funding?.toString() || "0.00";
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
            tagStyleActive: "whiteOnPink"
        },
        {
            id: 2,
            label: `FY ${fiscalYear.value} Remaining Budget`,
            value: "2000000.00",
            color: "#A9AEB1 ",
            percent: `${calculatePercent("2000000.00", totalFunding)}%`,
            tagStyleActive: "darkTextGreyBackground"
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
            amount={totalFunding}
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
                    tagStyleActive={item.tagStyleActive}
                />
            ))}
        </CurrencyCard>
    );
};

export default ResearchBudgetVsSpending;
