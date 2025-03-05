import CurrencyFormat from "react-currency-format";
import CurrencyWithSmallCents from "../../CurrencyWithSmallCents/CurrencyWithSmallCents";
import ReverseLineGraph from "../../DataViz/LineGraph/ReverseLineGraph";
import RoundedBox from "../../RoundedBox";
import Tag from "../../Tag";

/**
 * @typedef {Object} BudgetCardProps
 * @property {string} title - The title of the card.
 * @property {number} totalReceived - The total received.
 * @property {number} totalFunding - The total funding.
 * @property {string} [tagText] - The text for the tag.
 * @property {string} [helperText] - The helper text.
 */

/**
 * @component BudgetCard
 * @param {BudgetCardProps} props - Properties passed to component
 * @returns {JSX.Element} - The BudgetSummaryCard component.
 */
const ReceivedFundingCard = ({ title, totalReceived, totalFunding }) => {
    const graphData = [
        {
            id: 1,
            value: totalReceived,
            color: "var(--data-viz-budget-graph-1)"
        },
        {
            id: 2,
            value: totalFunding,
            color: "var(--data-viz-budget-graph-2)"
        }
    ];

    return (
        <RoundedBox
            dataCy="budget-received-card"
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
                    amount={totalReceived}
                    dollarsClasses="font-sans-xl text-bold margin-bottom-0"
                    centsStyles={{ fontSize: "10px" }}
                />
                {totalFunding > 0 && <Tag tagStyle={"budgetAvailable"}>Received</Tag>}
            </div>
            {totalFunding > 0 && (
                <div
                    id="currency-summary-card"
                    className="margin-top-2"
                >
                    <ReverseLineGraph data={graphData} />
                </div>
            )}
            <div className="font-12px margin-top-2 display-flex flex-justify-end">
                <div>
                    Received{" "}
                    <CurrencyFormat
                        value={totalReceived ?? 0}
                        displayType={"text"}
                        thousandSeparator={true}
                        prefix={"$"}
                        decimalScale={totalReceived > 0 ? 2 : 0}
                        fixedDecimalScale
                    />{" "}
                    of{" "}
                    <CurrencyFormat
                        value={totalFunding ?? 0}
                        displayType={"text"}
                        thousandSeparator={true}
                        prefix={"$"}
                        renderText={(totalFunding) => <span>{totalFunding}</span>}
                        decimalScale={totalFunding > 0 ? 2 : 0}
                        fixedDecimalScale
                    />
                </div>
            </div>
        </RoundedBox>
    );
};
export default ReceivedFundingCard;
