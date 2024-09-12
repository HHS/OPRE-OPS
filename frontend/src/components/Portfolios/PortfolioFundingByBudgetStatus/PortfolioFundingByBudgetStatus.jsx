import { useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import CurrencyFormat from "react-currency-format";
import { ResponsiveDonutWithInnerPercent } from "../../UI/ResponsiveDonutWithInnerPercent/ResponsiveDonutWithInnerPercent";
import CustomLayerComponent from "../../UI/ResponsiveDonutWithInnerPercent/CustomLayerComponent";
import Tag from "../../UI/Tag/Tag";
import styles from "./styles.module.css";
import RoundedBox from "../../UI/RoundedBox/RoundedBox";

const PortfolioFundingByBudgetStatus = () => {
    const portfolioFunding = useSelector((state) => state.portfolioBudgetSummary.portfolioBudget);
    const fiscalYear = useSelector((state) => state.portfolio.selectedFiscalYear);
    const [percent, setPercent] = useState("");
    const [hoverId, setHoverId] = useState("");
    const totalFunding = portfolioFunding.total_funding.amount;
    const data = [
        {
            id: 1,
            label: "Available",
            value: portfolioFunding.available_funding.amount || 0,
            color: "var(--data-viz-primary-5)",
            percent: Math.round(portfolioFunding.available_funding.percent) + "%"
        },
        {
            id: 2,
            label: "Planned",
            value: portfolioFunding.planned_funding.amount || 0,
            color: "var(--data-viz-bl-by-status-2)",
            percent: Math.round(portfolioFunding.planned_funding.percent) + "%"
        },
        {
            id: 3,
            label: "Executing",
            value: portfolioFunding.in_execution_funding.amount || 0,
            color: "var(--data-viz-bl-by-status-3)",
            percent: Math.round(portfolioFunding.in_execution_funding.percent) + "%"
        },
        {
            id: 4,
            label: "Obligated",
            value: portfolioFunding.obligated_funding.amount || 0,
            color: "var(--data-viz-bl-by-status-4)",
            percent: Math.round(portfolioFunding.obligated_funding.percent) + "%"
        }
    ];

    const LegendItem = ({ id, label, value, color, percent }) => {
        const isGraphActive = hoverId === id;
        return (
            <div className="grid-row margin-top-2">
                <div className="grid-col-5">
                    <div className="display-flex flex-align-center">
                        <FontAwesomeIcon
                            icon={faCircle}
                            className={`height-1 width-1 margin-right-05`}
                            style={{ color: color }}
                        />
                        <span className={isGraphActive ? "fake-bold" : ""}>{label}</span>
                    </div>
                </div>
                <div className="grid-col-6">
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
                    />
                </div>
            </div>
        );
    };

    return (
        <RoundedBox className=" padding-y-205 padding-x-4 display-inline-block">
            <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">
                FY {fiscalYear.value} Budget Status
            </h3>

            <div className="display-flex flex-justify">
                <div
                    className={
                        totalFunding > 0 ? `${styles.widthLegend} maxw-card-lg font-12px` : "width-card-lg font-12px"
                    }
                >
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
                </div>
                <div
                    id="portfolioBudgetStatusChart"
                    className="width-card height-card margin-top-neg-1 margin-left-2"
                    aria-label="This is a Donut Chart that displays the percent by budget line status in the center."
                    role="img"
                >
                    <ResponsiveDonutWithInnerPercent
                        data={data}
                        width={150}
                        height={150}
                        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                        setPercent={setPercent}
                        setHoverId={setHoverId}
                        CustomLayerComponent={CustomLayerComponent(percent)}
                        container_id="portfolioBudgetStatusChart"
                    />
                </div>
            </div>
        </RoundedBox>
    );
};

export default PortfolioFundingByBudgetStatus;
