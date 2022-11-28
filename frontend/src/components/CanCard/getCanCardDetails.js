import { setCanFundingData } from "./canCardDetailSlice";
import ApplicationContext from "../../applicationContext/ApplicationContext";

export const getCanTotalFundingandSetState = (id, fiscalYear) => {
    return async (dispatch, getState) => {
        const responseData = await getCanFundingSummary(id, fiscalYear);
        dispatch(setCanFundingData(responseData));
    };
};

export const getCanFundingSummary = async (id, fiscalYear) => {
    let responseData = {};

    if (id && fiscalYear) {
        responseData = await ApplicationContext.get()
            .helpers()
            .callBackend(`/ops/fundingSummary?can_id=${id}&fiscal_year=${fiscalYear}`, "get");
    }
    return responseData;
};

export const getCanFiscalYearByCan = async (id, fiscalYear) => {
    let responseData = {};

    if (id && fiscalYear) {
        responseData = await ApplicationContext.get()
            .helpers()
            .callBackend(`/ops/can-fiscal-year/${id}/${fiscalYear}`, "get");
    }

    return responseData;
};

export const getBudgetLineItemByCan = async (id, fiscalYear) => {
    const responseData = await ApplicationContext.get()
        .helpers()
        .callBackend(`/ops/budget-line-items/${id}/${fiscalYear}`, "get");
    return responseData;
};

export const getPortfolioBudgetDetailsByCan = async (can, fiscalYear) => {
    let responseData = [];

    let canFiscalYearData = await ApplicationContext.get()
        .helpers()
        .callBackend(`/ops/can-fiscal-year/${can.id}/${fiscalYear}`, "get");
    console.log(canFiscalYearData);
    let canBudgetLineData = await ApplicationContext.get()
        .helpers()
        .callBackend(`/ops/budget-line-items/${can.id}/${fiscalYear}`, "get");
    console.log(canBudgetLineData);
    let total_funding = canFiscalYearData.total_fiscal_year_funding;
    let planned = 0;
    let in_execution = 0;
    let obligated = 0;
    canBudgetLineData.forEach((bli) => {
        if (bli.status.status === "Planned") planned += bli.funding;
        if (bli.status.status === "In Execution") in_execution += bli.funding;
        if (bli.status.status === "Obligated") obligated += bli.funding;
    });
    let total_acconted_for = planned + in_execution + obligated;
    responseData.push({
        can_id: can.id,
        can_number: can.number,
        can_nickname: can.nickname,
        total_budget: total_funding,
        planned: planned,
        in_execution: in_execution,
        obligated: obligated,
        remaining: total_funding - total_acconted_for,
    });

    console.log("printing response data:");
    console.log(responseData);
    return responseData;
};
