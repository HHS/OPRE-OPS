import React from "react";
import PropTypes from "prop-types";
import CurrencyFormat from "react-currency-format";
import SummaryCard from "../../../UI/Cards";
import styles from "./BLIsByFYSummaryCard.styles.module.scss";
import { summaryCard } from "./BLIsFYSummaryCard.helpers";
import { getDecimalScale } from "../../../../helpers/currencyFormat.helpers";

/**
 * A component that displays the total budget lines for an agreement.
 *
 * @param {Object} props - The component props.
 * @param {Array<any>} props.budgetLineItems - The budget line items for the agreement.
 * @returns {React.JSX.Element} - The agreement total budget lines card component JSX.
 */
const BLIsByFYSummaryCard = ({ budgetLineItems = [] }) => {
    const id = React.useId();
    const { chartData } = summaryCard(budgetLineItems);

    return (
        <SummaryCard
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
        </SummaryCard>
    );
};

BLIsByFYSummaryCard.propTypes = {
    budgetLineItems: PropTypes.array.isRequired
};

export default BLIsByFYSummaryCard;
