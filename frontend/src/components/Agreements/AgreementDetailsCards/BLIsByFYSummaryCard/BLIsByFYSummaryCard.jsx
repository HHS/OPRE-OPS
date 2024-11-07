import React from "react";
import CurrencyFormat from "react-currency-format";
import { getDecimalScale } from "../../../../helpers/currencyFormat.helpers";
import Card from "../../../UI/Cards/Card";
import styles from "./BLIsByFYSummaryCard.styles.module.scss";
import { summaryCard } from "./BLIsFYSummaryCard.helpers";

/**
 * @component Budget Lines Line Graph by Fiscal Year Card
 * @typedef {import("../../../BudgetLineItems/BudgetLineTypes").BudgetLine} BudgetLine
 * @param {Object} props - The component props.
 * @param {BudgetLine[]} props.budgetLineItems - The budget line items for the agreement.
 * @returns {JSX.Element} - The agreement total budget lines card component JSX.
 */
const BLIsByFYSummaryCard = ({ budgetLineItems = [] }) => {
    const id = React.useId();
    const { chartData } = summaryCard(budgetLineItems);

    return (
        <Card
            title="Budget Lines by Fiscal Year"
            dataCy="blis-by-fy-card"
        >
            <div>
                {chartData.map((item, index) => (
                    <div
                        className="display-flex margin-y-105 font-12px"
                        key={`blis-fy-${index}-${id}`}
                    >
                        <span>FY {item.FY}</span>
                        <div
                            className="margin-x-1"
                            style={{ flex: item.ratio }}
                        >
                            <div className={styles.barBox}>
                                <div
                                    className={styles.rightBar}
                                    style={{ backgroundColor: item.color }}
                                />
                            </div>
                        </div>
                        <CurrencyFormat
                            value={item.total}
                            displayType="text"
                            thousandSeparator=","
                            prefix="$"
                            decimalScale={getDecimalScale(item.total)}
                            fixedDecimalScale={true}
                        />
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default BLIsByFYSummaryCard;
