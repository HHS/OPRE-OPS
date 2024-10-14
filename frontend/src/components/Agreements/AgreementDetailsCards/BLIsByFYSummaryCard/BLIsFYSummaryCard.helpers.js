import { fiscalYearFromDate } from "../../../../helpers/utils";
import constants from "../../../../constants";

const { blisByFYChartColors } = constants;

const addFiscalYearToBudgetLineItems = (budgetLineItems) => {
    return budgetLineItems.map((bli) => ({ ...bli, fiscalYear: fiscalYearFromDate(bli.date_needed) }));
};

const calculateBLITotal = (budgetLineItem) => {
    if (!budgetLineItem.fiscalYear || budgetLineItem.amount == null) return 0;
    let fee = budgetLineItem.amount * budgetLineItem?.proc_shop_fee_percentage;
    let total = budgetLineItem.amount + fee;
    return total;
};

const calculateFYTotalsMap = (budgetLineItems) => {
    return budgetLineItems.reduce((acc, cur) => {
        const total = calculateBLITotal(cur);
        if (!cur.fiscalYear || total === 0) return acc;
        if (!(cur.fiscalYear in acc)) {
            acc[cur.fiscalYear] = total;
        } else {
            acc[cur.fiscalYear] = acc[cur.fiscalYear] + total;
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

export const summaryCard = (budgetLineItems) => {
    const BLIsByFiscalYear = addFiscalYearToBudgetLineItems(budgetLineItems);
    const fyTotalsMap = calculateFYTotalsMap(BLIsByFiscalYear);
    const fyTotalsAll = calculateFyTotalsAll(fyTotalsMap);
    const fyTotals = fyTotalsAll.slice(0, 5).reverse();
    const maxFyTotal = getMaxFyTotal(fyTotals);
    const chartData = fyTotals.map((fyVal, index) => {
        return {
            FY: fyVal.fiscalYear,
            total: fyVal.total,
            ratio: fyVal.total / maxFyTotal,
            color: blisByFYChartColors[index].color
        };
    });
    return {
        chartData
    };
};
