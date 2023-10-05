import PropTypes from "prop-types";
import { ResponsiveBar } from "@nivo/bar";
import CurrencySummaryCard from "../../UI/CurrencySummaryCard/CurrencySummaryCard";
import { fiscalYearFromDate } from "../../../helpers/utils";
import constants from "../../../constants";
import SummaryCard from "../../UI/SummaryCard";
const { blisByFYChartColors } = constants;

/**
 * A component that displays the total budget lines for an agreement.
 *
 * @param {Object} props - The component props.
 * @param {Array<any>} props.budgetLineItems - The budget line items for the agreement.
 * @returns {React.JSX.Element} - The agreement total budget lines card component JSX.
 */
const BudgetLinesByFiscalYear = ({ budgetLineItems }) => {
    const headerText = "Budget Lines by Fiscal Year";
    const blisFy = budgetLineItems.map((bli) => ({ ...bli, fiscalYear: fiscalYearFromDate(bli.date_needed) }));
    const fyTotalsMaps = blisFy.reduce((acc, cur) => {
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
    const fyTotals = Object.keys(fyTotalsMaps).map((fy) => ({ fiscalYear: fy, amount: fyTotalsMaps[fy] }));

    // combine the fyTotals and blisByFYChartColors
    const chartData = fyTotals
        .map((fyVal, index) => {
            return {
                FY: fyVal.fiscalYear,
                budget: fyVal.amount,
                color: blisByFYChartColors[index].color
            };
        })
        // sort by year descending
        .sort((a, b) => b.FY - a.FY);

    return (
        <SummaryCard title={headerText}>
            {chartData.length > 0 ? (
                <div
                    className="width-full"
                    style={{ height: "140px" }}
                >
                    <ResponsiveBar
                        data={chartData}
                        keys={["budget"]}
                        indexBy="FY"
                        margin={{ bottom: 0, left: 50, right: 20, top: 0 }}
                        padding={0.3}
                        layout="horizontal"
                        colors={{ datum: "data.color" }}
                        borderColor={{
                            from: "color",
                            modifiers: [["darker", 1.6]]
                        }}
                        axisTop={null}
                        axisRight={null}
                        axisBottom={null}
                        enableGridY={false}
                        enableGridX={false}
                        enableLabel={true}
                        isInteractive={false}
                        role="application"
                        ariaLabel="Totals by Fiscal Year"
                        borderRadius={2}
                        valueFormat=">-$,.2f"
                    />
                </div>
            ) : (
                <p>No budget lines</p>
            )}
        </SummaryCard>
    );
};

BudgetLinesByFiscalYear.propTypes = {
    budgetLineItems: PropTypes.array.isRequired
};

export default BudgetLinesByFiscalYear;
