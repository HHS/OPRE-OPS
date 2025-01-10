import constants from "../../../constants";
import { getCurrentFiscalYear } from "../../../helpers/utils";
/**
 *  @typedef {import("../../../components/CANs/CANTypes").FundingBudget} FundingBudget
 */
const { budgetsByFYChartColors } = constants;

/** @param {FundingBudget} fundingBudget */
const calculateBudgetTotal = (fundingBudget) => {
    if (!fundingBudget.fiscal_year || fundingBudget.budget == null) return 0;

    return fundingBudget.budget;
};

/** @param {FundingBudget[]} fundingBudgets */
const calculateFYTotalsMap = (fundingBudgets) => {
    return fundingBudgets.reduce((acc, cur) => {
        const total = calculateBudgetTotal(cur);
        if (!cur.fiscal_year || total === 0) return acc;
        if (!(cur.fiscal_year in acc)) {
            acc[cur.fiscal_year] = total;
        } else {
            acc[cur.fiscal_year] = acc[cur.fiscal_year] + total;
        }
        return acc;
    }, {});
};

const getMaxFyTotal = (fyTotals) => {
    return Math.max(...fyTotals.map((o) => o.total));
};

const getLast5FiscalYears = () => {
    const currentFY = getCurrentFiscalYear();
    return Array.from({ length: 5 }, (_, i) => (currentFY - i).toString());
};

/** @param {FundingBudget[]} fundingBudgets */
export const summaryCard = (fundingBudgets) => {
    const fyTotalsMap = calculateFYTotalsMap(fundingBudgets);
    const last5FYs = getLast5FiscalYears();

    // Ensure all 5 years exist in the data
    const fyTotals = last5FYs.map((fy) => ({
        fiscalYear: fy,
        total: fyTotalsMap[fy] || 0
    }));

    const maxFyTotal = getMaxFyTotal(fyTotals);
    const chartData = fyTotals.map((fyVal, index) => ({
        FY: fyVal.fiscalYear,
        total: fyVal.total,
        ratio: maxFyTotal ? fyVal.total / maxFyTotal : 0,
        color: budgetsByFYChartColors[index].color
    }));

    return {
        chartData
    };
};
