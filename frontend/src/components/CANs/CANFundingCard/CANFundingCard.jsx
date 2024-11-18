import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CurrencyFormat from "react-currency-format";
import { useGetCanFundingSummaryQuery } from "../../../api/opsAPI";
import { calculatePercent } from "../../../helpers/utils";
import CurrencyWithSmallCents from "../../UI/CurrencyWithSmallCents/CurrencyWithSmallCents";
import RoundedBox from "../../UI/RoundedBox";
import Tag from "../../UI/Tag";
import LineGraph from "../../UI/DataViz/LineGraph";

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

    if (isLoading) {
        return <div>Loading...</div>;
    }
    if (error) {
        return <div>An error occurred loading CAN funding data</div>;
    }

    const title = `${data?.cans?.[0]?.can?.number}-${data?.cans?.[0]?.can?.active_period}Y`;
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
            color: overBudget ? "var(--feedback-error)" : "var(--data-viz-budget-graph-2)",
            tagStyle: "darkTextWhiteBackground",
            tagStyleActive: overBudget ? "lightTextRedBackground" : "lightTextGreenBackground",
            percent: `${calculatePercent(totalSpending, totalFunding)}%`
        },
        {
            id: 2,
            label: `Remaining Budget`,
            value: remainingBudget,
            color: overBudget ? "var(--feedback-error)" : "var(--data-viz-budget-graph-1)",
            tagStyle: "darkTextWhiteBackground",
            tagStyleActive: overBudget ? "lightTextRedBackground" : "darkTextGreyBackground",
            percent: `${calculatePercent(remainingBudget, totalFunding)}%`
        }
    ];

    return (
        <RoundedBox
            className={"padding-y-205 padding-x-4 display-inline-block"}
            dataCy={`can-funding-summary-card-${canId}`}
            style={{ height: "14.5rem" }}
        >
            <h3
                className="margin-0 margin-bottom-2 font-12px text-base-dark text-normal"
                style={{ whiteSpace: "pre-line", lineHeight: "20px" }}
            >
                {title} <br /> CAN Available Budget
            </h3>

            <div className="font-32px margin-0 display-flex flex-justify flex-align-end">
                <CurrencyWithSmallCents
                    amount={remainingBudget}
                    dollarsClasses="font-sans-xl text-bold margin-bottom-0"
                    centsStyles={{ fontSize: "10px" }}
                />
                {overBudget ? (
                    <Tag tagStyle={"lightTextRedBackground"}>
                        <FontAwesomeIcon
                            icon={faTriangleExclamation}
                            title="Over Budget"
                        />{" "}
                        Over Budget
                    </Tag>
                ) : (
                    <Tag tagStyle={"budgetAvailable"}>Available</Tag>
                )}
            </div>
            <div
                id="currency-summary-card"
                className="margin-top-2"
            >
                <LineGraph
                    data={canFundingBarData}
                    isStriped={true}
                    overBudget={overBudget}
                />
            </div>
            <div className="font-12px margin-top-2 display-flex flex-justify-end">
                <div>
                    Spending {""}
                    <CurrencyFormat
                        value={totalSpending || 0}
                        displayType={"text"}
                        thousandSeparator={true}
                        prefix={"$"}
                        renderText={(totalSpending) => <span>{totalSpending}</span>}
                    />{" "}
                    of{" "}
                    <CurrencyFormat
                        value={totalFunding || 0}
                        displayType={"text"}
                        thousandSeparator={true}
                        prefix={"$"}
                        renderText={(totalFunding) => <span>{totalFunding}</span>}
                    />
                </div>
            </div>
        </RoundedBox>
    );
};
export default CANFundingCard;
