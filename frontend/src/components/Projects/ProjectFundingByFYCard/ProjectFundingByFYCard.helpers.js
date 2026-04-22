import constants from "../../../constants";

const { budgetsByFYChartColors } = constants;

/**
 * Returns the last 5 fiscal years counting back from the given year (inclusive).
 * @param {number} fiscalYear
 * @returns {number[]}
 */
export const getLast5FiscalYears = (fiscalYear) => Array.from({ length: 5 }, (_, i) => fiscalYear - i);

/**
 * Build chart data for the "Project Funding By FY" line bar card.
 * Shows the last 5 FYs relative to selectedFY; zeros for years with no data.
 * Matches the pattern used by CANBudgetByFYCard.helpers.js.
 *
 * @param {Array<{fiscal_year: number, amount: number}>} fundingByFiscalYear
 * @param {number} fiscalYear - Selected fiscal year
 * @returns {Array<{FY: number, total: number, ratio: number, color: string}>}
 */
export const buildFYChartData = (fundingByFiscalYear, fiscalYear) => {
    const fyMap = Object.fromEntries((fundingByFiscalYear ?? []).map((item) => [item.fiscal_year, item.amount]));

    const last5 = getLast5FiscalYears(+fiscalYear);
    const fyTotals = last5.map((fy) => ({ fy, total: fyMap[fy] ?? 0 }));
    const maxTotal = Math.max(...fyTotals.map((t) => t.total), 1);

    return fyTotals.map((item, index) => ({
        FY: item.fy,
        total: item.total,
        ratio: item.total / maxTotal,
        color: budgetsByFYChartColors[index].color
    }));
};
