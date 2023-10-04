import PropTypes from "prop-types";
import { ResponsiveBar } from "@nivo/bar";
import CurrencySummaryCard from "../../UI/CurrencySummaryCard/CurrencySummaryCard";
import { fiscalYearFromDate } from "../../../helpers/utils";
import constants from "../../../constants";
const { barChartColors } = constants;

/**
 * A component that displays the total budget lines for an agreement.
 *
 * @param {Object} props - The component props.
 * @param {Array<any>} props.budgetLineItems - The budget line items for the agreement.
 * @returns {React.JSX.Element} - The agreement total budget lines card component JSX.
 */
const AgreementTotalBudgetLinesCard = ({ budgetLineItems }) => {
    const headerText = "Agreement Total";
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
    const currentFiscalYear = fiscalYearFromDate(new Date());
    const nextThreeFyValues = fyValues.filter((fyVal) => {
        return fyVal.fiscalYear >= currentFiscalYear && fyVal.fiscalYear < currentFiscalYear + 3;
    });

    // combine the fyValues and barChartColors
    const chartData = nextThreeFyValues
        .map((fyVal, index) => {
            return {
                FY: fyVal.fiscalYear,
                budget: fyVal.amount,
                color: barChartColors[index].color
            };
        })
        // sort by year descending
        .sort((a, b) => b.FY - a.FY);

    return (
        <CurrencySummaryCard
            headerText={headerText}
            amount={totalValue}
        >
            <h4 className="margin-0 margin-top-2 margin-bottom-1 font-12px text-base-dark text-normal">
                Agreement Subtotal
            </h4>
        </CurrencySummaryCard>
    );
};

AgreementTotalBudgetLinesCard.propTypes = {
    budgetLineItems: PropTypes.array.isRequired
};

export default AgreementTotalBudgetLinesCard;
