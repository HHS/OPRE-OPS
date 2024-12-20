import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CurrencyFormat from "react-currency-format";
import CurrencyWithSmallCents from "../../CurrencyWithSmallCents/CurrencyWithSmallCents";
import LineGraph from "../../DataViz/LineGraph";
import RoundedBox from "../../RoundedBox";
import Tag from "../../Tag";

/**
 * @typedef {Object} BudgetCardProps
 * @property {number} cardId - The card id.
 * @property {string} title - The title of the card.
 * @property {number} totalSpending - The total spending.
 * @property {number} totalFunding - The total funding.
 */

/**
 * @component BudgetCard
 * @param {BudgetCardProps} props - Properties passed to component
 * @returns {JSX.Element} - The BudgetSummaryCard component.
 */
const BudgetCard = ({ cardId, title, totalSpending, totalFunding }) => {
    const overBudget = totalSpending > totalFunding;
    const remainingBudget = totalFunding - totalSpending;

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
            dataCy={`budget-summary-card-${cardId}`}
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
                    Spending{" "}
                    <CurrencyFormat
                        value={totalSpending ?? 0}
                        displayType={"text"}
                        thousandSeparator={true}
                        prefix={"$"}
                        decimalScale={2}
                        fixedDecimalScale
                    />{" "}
                    of{" "}
                    <CurrencyFormat
                        value={totalFunding ?? 0}
                        displayType={"text"}
                        thousandSeparator={true}
                        prefix={"$"}
                        renderText={(totalFunding) => <span>{totalFunding}</span>}
                        decimalScale={2}
                        fixedDecimalScale
                    />
                </div>
            </div>
        </RoundedBox>
    );
};
export default BudgetCard;
