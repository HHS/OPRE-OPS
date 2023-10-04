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
const AgreementTotalBudgetLinesCard = ({ budgetLineItems }) => {
    const headerText = "Budget Lines by Fiscal Year";
    const valuedBlisFy = budgetLineItems.map((bli) => ({ ...bli, fiscalYear: fiscalYearFromDate(bli.date_needed) }));
    const fyValuesMap = valuedBlisFy.reduce((acc, cur) => {
        if (!cur.fiscalYear || cur.amount == null) return acc;
        if (!(cur.fiscalYear in acc)) {
            acc[cur.fiscalYear] = cur.amount;
        } else {
            acc[cur.fiscalYear] = acc[cur.fiscalYear] + cur.amount;
        }
        return acc;
    }, {});
    const fyValues = Object.keys(fyValuesMap).map((fy) => ({ fiscalYear: fy, amount: fyValuesMap[fy] }));
    const totalValue = fyValues.reduce((acc, cur) => acc + cur.amount, 0);
    // const currentFiscalYear = fiscalYearFromDate(new Date());
    // const nextThreeFyValues = fyValues.filter((fyVal) => {
    //     return fyVal.fiscalYear >= currentFiscalYear && fyVal.fiscalYear < currentFiscalYear + 3;
    // });

    // combine the fyValues and blisByFYChartColors
    const chartData = fyValues
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
                <div className="width-full height-10">
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
                        ariaLabel="Total Agreement Value by Fiscal Year"
                        borderRadius={2}
                        valueFormat=">-$,.2f"
                    />
                </div>
            ) : (
                <p>No budget lines in the next 3 FYs</p>
            )}
        </SummaryCard>
    );
};

AgreementTotalBudgetLinesCard.propTypes = {
    budgetLineItems: PropTypes.array.isRequired
};

export default AgreementTotalBudgetLinesCard;
