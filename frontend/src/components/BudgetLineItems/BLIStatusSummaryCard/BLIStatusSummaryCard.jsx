import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import CurrencyFormat from "react-currency-format";
import { calculatePercent } from "../../../helpers/utils";
import ResponsiveDonutWithInnerPercent from "../../UI/DataViz/ResponsiveDonutWithInnerPercent";
import CustomLayerComponent from "../../UI/DataViz/ResponsiveDonutWithInnerPercent/CustomLayerComponent";
import RoundedBox from "../../UI/RoundedBox";
import Tag from "../../UI/Tag/Tag";
import styles from "./styles.module.css";

/**
 * Renders a summary card that displays the total amount and percentage of budget lines by status.
 * @component
 * @param {Object} props - The props that were defined by the caller of this component.
 * @param {number} props.totalAmount - the total amount of all budget lines
 * @param {number} props.totalDraftAmount - the total amount of draft budget lines
 * @param {number} props.totalPlannedAmount - The total amount of planned budget lines
 * @param {number} props.totalExecutingAmount - The total amount of in execution budget lines
 * @param {number} props.totalObligatedAmount - The total amount of obligated budget lines
 * @param {number} props.totalOvercomeByEventsAmount - The total amount of budget lines overcome by events
 * @returns {JSX.Element} - A React component that displays the budget line summary card.
 */
const BLIStatusSummaryCard = ({
    totalDraftAmount,
    totalPlannedAmount,
    totalExecutingAmount,
    totalObligatedAmount,
    totalOvercomeByEventsAmount,
    totalAmount
}) => {
    const [percent, setPercent] = React.useState("");
    const [hoverId, setHoverId] = React.useState(-1);

    const data = [
        {
            id: 1,
            label: "Draft",
            value: totalDraftAmount ?? 0,
            color: "var(--data-viz-bl-by-status-1)",
            percent: `${calculatePercent(totalDraftAmount ?? 0, totalAmount)}%`
        },
        {
            id: 2,
            label: "Planned",
            value: totalPlannedAmount ?? 0,
            color: "var(--data-viz-bl-by-status-2)",
            percent: `${calculatePercent(totalPlannedAmount ?? 0, totalAmount)}%`
        },
        {
            id: 3,
            label: "Executing",
            value: totalExecutingAmount ?? 0,
            color: "var(--data-viz-bl-by-status-3)",
            percent: `${calculatePercent(totalExecutingAmount ?? 0, totalAmount)}%`
        },
        {
            id: 4,
            label: "Obligated",
            value: totalObligatedAmount ?? 0,
            color: "var(--data-viz-bl-by-status-4)",
            percent: `${calculatePercent(totalObligatedAmount ?? 0, totalAmount)}%`
        },
        {
            id: 5,
            label: "O.B.E.",
            value: totalOvercomeByEventsAmount ?? 0,
            color: "var(--data-viz-bl-by-status-4)",
            percent: `${calculatePercent(totalOvercomeByEventsAmount ?? 0, totalAmount)}%`
        }
    ];

    /**
     * Renders a legend item for a budget line item status summary card.
     * @param {Object} props - The props object.
     * @param {number} props.id - The ID of the legend item.
     * @param {string} props.label - The label of the legend item.
     * @param {number} props.value - The value of the legend item.
     * @param {string} props.color - The color of the legend item.
     * @param {string} props.percent - The percentage of the legend item.
     * @returns {React.JSX.Element} - The legend item component.
     */
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
                            aria-label={`${label} indicator`}
                            role="img"
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
                        decimalScale={value === 0 ? 0 : 2}
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
        <RoundedBox
            dataCy="bli-status-summary-card"
            style={{ padding: "20px 0 20px 30px" }}
        >
            <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">Budget Lines By Status</h3>

            <div className="display-flex flex-justify">
                <div
                    className={
                        totalAmount > 0 ? `${styles.widthLegend} maxw-card-lg font-12px` : "width-card-lg font-12px"
                    }
                    style={{ minWidth: "230px" }}
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
                    id="budget-line-status-chart"
                    className="width-card height-card margin-top-neg-1"
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
                        container_id="budget-line-status-chart"
                    />
                </div>
            </div>
        </RoundedBox>
    );
};

export default BLIStatusSummaryCard;
