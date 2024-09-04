import React from "react";
import { useGetCanFundingSummaryQuery } from "../../../api/opsAPI";
import { calculatePercent } from "../../../helpers/utils";
import RoundedBox from "../../UI/RoundedBox";
import CANFundingBar from "../CANFundingBar";
import CurrencyFormat from "react-currency-format";
import Tag from "../../UI/Tag";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation, faCircle } from "@fortawesome/free-solid-svg-icons";
import { getDecimalScale } from "../../../helpers/currencyFormat.helpers";

/**
 * A component that displays funding information for a CAN
 * @component
 * @param {Object} props - The props object.
 * @param {Object} props.can - The CAN object.
 * @param {number} props.pendingAmount - The pending amount.
 * @param {boolean} props.afterApproval - A flag indicating whether the funding is after approval.
 * @returns {JSX.Element} - The CANFundingCard component.
 */
const CANFundingCard = ({ can, pendingAmount, afterApproval }) => {
    const adjustAmount = afterApproval ? pendingAmount : 0;
    const canId = can?.id;
    const { data, error, isLoading } = useGetCanFundingSummaryQuery(canId);
    const [activeId, setActiveId] = React.useState(0);

    if (isLoading) {
        return <div>Loading...</div>;
    }
    if (error) {
        return <div>An error occurred loading CAN funding data</div>;
    }
    const title = `${data.can.number} (${data.can.active_period} Year)`;
    const totalFunding = Number(data.total_funding);
    const availableFunding = Number(data.available_funding);
    const totalAccountedFor = totalFunding - availableFunding; // same as adding planned, obligated, in_execution
    const totalSpending = totalAccountedFor + adjustAmount;
    const remainingBudget = availableFunding - adjustAmount;
    const overBudget = remainingBudget < 0;

    const canFundingBarData = [
        {
            id: 1,
            label: "Total Spending",
            value: totalSpending,
            color: overBudget ? "#B50909" : "#80A858",
            tagStyle: "darkTextWhiteBackground",
            tagStyleActive: overBudget ? "lightTextRedBackground" : "lightTextGreenBackground",
            percent: `${calculatePercent(totalSpending, totalFunding)}%`
        },
        {
            id: 2,
            label: `Remaining Budget`,
            value: remainingBudget,
            color: overBudget ? "#B50909" : "#A9AEB1",
            tagStyle: "darkTextWhiteBackground",
            tagStyleActive: overBudget ? "lightTextRedBackground" : "darkTextGreyBackground",
            percent: `${calculatePercent(remainingBudget, totalFunding)}%`
        }
    ];

    /**
     * A component that displays a legend item with a label, value, color, and percentage.
     *
     * @param {object} props - The props object containing the following properties:
     * @param {number} props.id - The ID of the legend item.
     * @param {string} props.label - The label of the legend item.
     * @param {number} props.value - The value of the legend item.
     * @param {string} props.color - The color of the legend item.
     * @param {string} props.percent - The percentage of the legend item.
     * @param {object} props.tagStyle - The style of the tag when it's not active.
     * @param {object} props.tagStyleActive - The style of the tag when it's active.
     * @returns {React.JSX.Element} A React component that displays a legend item.
     */
    const LegendItem = ({ id, label, value, color, percent, tagStyle, tagStyleActive }) => {
        const isGraphActive = activeId === id;
        return (
            <div className="display-flex flex-justify margin-top-2">
                <div className="">
                    <div className="display-flex flex-align-center">
                        <FontAwesomeIcon
                            icon={faCircle}
                            className={`height-1 width-1 margin-right-05`}
                            style={{ color: color }}
                        />

                        <span className={isGraphActive ? "fake-bold" : ""}>{label}</span>
                    </div>
                </div>
                <div>
                    <CurrencyFormat
                        value={value}
                        displayType={"text"}
                        thousandSeparator={true}
                        prefix={"$ "}
                        renderText={(value) => <span className={isGraphActive ? "fake-bold" : ""}>{value}</span>}
                    />
                    <Tag
                        tagStyle={tagStyle}
                        tagStyleActive={tagStyleActive}
                        text={percent}
                        label={label}
                        active={isGraphActive}
                        className="margin-left-1"
                    />
                </div>
            </div>
        );
    };

    return (
        <RoundedBox
            className={`padding-y-205 padding-x-4 padding-right-9 display-inline-block`}
            dataCy={`can-funding-summary-card-${canId}`}
            style={{ height: "14.5rem" }}
        >
            <h3
                className="margin-0 margin-bottom-2 font-12px text-base-dark text-normal"
                style={{ whiteSpace: "pre-line", lineHeight: "20px" }}
            >
                {title} <br /> CAN Total Budget
            </h3>

            <div className="font-20px margin-0 display-flex flex-justify">
                <CurrencyFormat
                    className={`text-bold`}
                    value={totalFunding || 0}
                    displayType={"text"}
                    thousandSeparator={true}
                    prefix={"$"}
                    decimalScale={getDecimalScale(totalFunding)}
                    fixedDecimalScale={true}
                />
                {overBudget && (
                    <Tag tagStyle={"lightTextRedBackground"}>
                        Over Budget{" "}
                        <FontAwesomeIcon
                            icon={faTriangleExclamation}
                            title="Over Budget"
                        />
                    </Tag>
                )}
            </div>
            <div
                id="currency-summary-card"
                className="margin-top-2"
            >
                <CANFundingBar
                    setActiveId={setActiveId}
                    data={canFundingBarData}
                />
            </div>
            <div className="font-12px margin-top-2">
                {canFundingBarData.map((item) => (
                    <LegendItem
                        key={item.id}
                        id={item.id}
                        label={item.label}
                        value={item.value}
                        color={item.color}
                        percent={item.percent}
                        tagStyle={item.tagStyle}
                        tagStyleActive={item.tagStyleActive}
                    />
                ))}
            </div>
        </RoundedBox>
    );
};
export default CANFundingCard;
