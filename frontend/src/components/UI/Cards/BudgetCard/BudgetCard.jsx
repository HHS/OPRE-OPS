import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CurrencyFormat from "react-currency-format";
import LineGraph from "../../DataViz/LineGraph";
import CurrencyWithSmallCents from "../../CurrencyWithSmallCents/CurrencyWithSmallCents";
import RoundedBox from "../../RoundedBox";
import Tag from "../../Tag";

/**
 * @typedef {Object} BudgetCardProps
 * @property {string} title - The title of the card.
 * @property {number} totalSpending - The total spending.
 * @property {number} totalFunding - The total funding.
 */

/**
 * @component BudgetCard
 * @param {BudgetCardProps} props - Properties passed to component
 * @returns {JSX.Element} - The BudgetSummaryCard component.
 */
const BudgetCard = ({ title, totalSpending, totalFunding }) => {
    const overBudget = totalSpending > totalFunding;
    const remainingBudget = overBudget ? 0 : totalFunding - totalSpending;
    const graphData = [
        {
            id: 1,
            value: totalSpending,
            color: overBudget ? "var(--feedback-error)" : "var(--data-viz-budget-graph-2)"
        },
        {
            id: 2,
            value: remainingBudget,
            color: overBudget ? "var(--feedback-error)" : "var(--data-viz-budget-graph-1)"
        }
    ];

    return (
        <RoundedBox
            className={"padding-y-205 padding-x-4 display-inline-block"}
            dataCy={`budget-summary-card`}
            style={{ height: "14.5rem" }}
        >
            <h3
                className="margin-0 margin-bottom-2 font-12px text-base-dark text-normal"
                style={{ whiteSpace: "pre-line", lineHeight: "20px" }}
            >
                {title}
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
                    data={graphData}
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
export default BudgetCard;
