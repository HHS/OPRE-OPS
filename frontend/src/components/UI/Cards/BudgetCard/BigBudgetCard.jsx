import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CurrencyFormat from "react-currency-format";
import CurrencyWithSmallCents from "../../CurrencyWithSmallCents/CurrencyWithSmallCents";
import LineGraph from "../../DataViz/LineGraph";
import RoundedBox from "../../RoundedBox";
import Tag from "../../Tag";

/**
 * @typedef {Object} BigBudgetCardProps
 * @property {string} title - The title of the card.
 * @property {number} totalSpending - The total spending.
 * @property {number} totalFunding - The total funding.
 */

/**
 * @component BigBudgetCard
 * @param {BigBudgetCardProps} props - Properties passed to component
 * @returns {JSX.Element} - The BudgetSummaryCard component.
 */
const BigBudgetCard = ({ title, totalSpending, totalFunding }) => {
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
        <>
            <RoundedBox
                className="width-full"
                id="big-budget-summary-card"
                dataCy={`big-budget-summary-card`}
                style={{ minHeight: "10.125rem" }}
            >
                <h3
                    className="margin-0 margin-bottom-2 font-12px text-base-dark text-normal"
                    style={{ whiteSpace: "pre-line", lineHeight: "20px" }}
                >
                    {title}
                </h3>

                <div className="font-32px margin-0 display-flex flex-justify">
                    <div className="display-flex flex-align-center">
                        <CurrencyWithSmallCents
                            amount={remainingBudget}
                            dollarsClasses="font-sans-xl text-bold margin-bottom-0"
                            centsStyles={{ fontSize: "10px" }}
                        />

                        {overBudget ? (
                            <Tag
                                tagStyle={"lightTextRedBackground"}
                                className="margin-left-1"
                            >
                                <FontAwesomeIcon
                                    icon={faTriangleExclamation}
                                    title="Over Budget"
                                />{" "}
                                Over Budget
                            </Tag>
                        ) : (
                            !(totalSpending === 0 && totalFunding === 0) && (
                                <Tag
                                    tagStyle={"budgetAvailable"}
                                    className="margin-left-1"
                                >
                                    Available
                                </Tag>
                            )
                        )}
                    </div>

                    <div className="font-12px margin-top-2 display-flex flex-justify-end">
                        <div>
                            Spending {""}
                            <CurrencyFormat
                                value={totalSpending ?? 0}
                                displayType={"text"}
                                thousandSeparator={true}
                                prefix={"$"}
                                renderText={(totalSpending) => <span>{totalSpending}</span>}
                            />{" "}
                            of{" "}
                            <CurrencyFormat
                                value={totalFunding ?? 0}
                                displayType={"text"}
                                thousandSeparator={true}
                                prefix={"$"}
                                renderText={(totalFunding) => <span>{totalFunding}</span>}
                            />
                        </div>
                    </div>
                </div>
                <div
                    id="currency-summary-card"
                    className="margin-top-2"
                >
                    {!(totalSpending === 0 && totalFunding === 0) && (
                        <LineGraph
                            data={graphData}
                            isStriped={true}
                            overBudget={overBudget}
                        />
                    )}
                </div>
            </RoundedBox>
            <p className="font-12px margin-0 text-base-dark">
                *Spending equals the sum of Budget Lines in Planned, Executing and Obligated Status
            </p>
        </>
    );
};
export default BigBudgetCard;
