import constants from "../../../constants";
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
const calculateFyTotalsAll = (fyTotalsMap) => {
    return Object.keys(fyTotalsMap).map((fy) => ({
        fiscalYear: fy,
        total: fyTotalsMap[fy]
    }));
};

const getMaxFyTotal = (fyTotals) => {
    return Math.max(...fyTotals.map((o) => o.total));
};

/** @param {FundingBudget[]} fundingBudgets */
export const summaryCard = (fundingBudgets) => {
    const fyTotalsMap = calculateFYTotalsMap(fundingBudgets);
    const fyTotalsAll = calculateFyTotalsAll(fyTotalsMap);
    const fyTotals = fyTotalsAll.slice(0, 5).reverse();
    const maxFyTotal = getMaxFyTotal(fyTotals);
    const chartData = fyTotals.map((fyVal, index) => {
        return {
            FY: fyVal.fiscalYear,
            total: fyVal.total,
            ratio: fyVal.total / maxFyTotal,
            color: budgetsByFYChartColors[index].color
        };
    });
    return {
        chartData
    };
};
