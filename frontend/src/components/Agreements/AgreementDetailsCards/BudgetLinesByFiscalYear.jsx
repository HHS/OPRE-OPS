import React from "react";
import PropTypes from "prop-types";
import CurrencyFormat from "react-currency-format";
import { fiscalYearFromDate } from "../../../helpers/utils";
import constants from "../../../constants";
import SummaryCard from "../../UI/SummaryCard";
import styles from "./BudgetLinesByFiscalYear.styles.module.scss";

/**
 * A component that displays the total budget lines for an agreement.
 *
 * @param {Object} props - The component props.
 * @param {Array<any>} props.budgetLineItems - The budget line items for the agreement.
 * @returns {React.JSX.Element} - The agreement total budget lines card component JSX.
 */
const BudgetLinesByFiscalYear = ({ budgetLineItems }) => {
    const id = React.useId();
    const { blisByFYChartColors } = constants;
    const headerText = "Budget Lines by Fiscal Year";
    const blisFy = budgetLineItems.map((bli) => ({ ...bli, fiscalYear: fiscalYearFromDate(bli.date_needed) }));
    const fyTotalsMap = blisFy.reduce((acc, cur) => {
        if (!cur.fiscalYear || cur.amount == null) return acc;
        // TODO: create BLI total function somewhere to use here and in AgreementBudgetLines, TotalSummaryCard, etc
        let fee = cur.amount * cur?.proc_shop_fee_percentage;
        let total = cur.amount + fee;
        if (!(cur.fiscalYear in acc)) {
            acc[cur.fiscalYear] = total;
        } else {
            acc[cur.fiscalYear] = acc[cur.fiscalYear] + total;
        }
        return acc;
    }, {});
    const fyTotalsAll = Object.keys(fyTotalsMap).map((fy) => ({ fiscalYear: fy, total: fyTotalsMap[fy] }));
    const fyTotals = fyTotalsAll.slice(0, 5);
    const maxFyTotal = Math.max(...fyTotals.map((o) => o.total));

    const chartData = fyTotals.map((fyVal, index) => {
        return {
            FY: fyVal.fiscalYear,
            total: fyVal.total,
            ratio: fyVal.total / maxFyTotal,
            color: blisByFYChartColors[index].color
        };
    });

    console.log(chartData);

    return (
        <SummaryCard title={headerText}>
            <div>
                {chartData.map((item, index) => (
                    <div
                        className="display-flex margin-y-1"
                        key={`blis-fy-${index}-${id}`}
                    >
                        <span>FY {item.FY}</span>
                        <div
                            className="margin-x-1"
                            style={{ flex: item.ratio }}
                        >
                            <div className={styles.barBox}>
                                <div
                                    className={`${styles.rightBar}`}
                                    style={{ backgroundColor: item.color }}
                                />
                            </div>
                        </div>
                        <CurrencyFormat
                            value={item.total}
                            displayType="text"
                            thousandSeparator=","
                            prefix="$"
                            decimalScale={2}
                            fixedDecimalScale={true}
                        />
                    </div>
                ))}
            </div>
        </SummaryCard>
    );
};

BudgetLinesByFiscalYear.propTypes = {
    budgetLineItems: PropTypes.array.isRequired
};

export default BudgetLinesByFiscalYear;
