import { getPortfolio } from "../../pages/portfolios/detail/getPortfolio";
import { setBudgetLineItems, setPortfolio } from "./portfolioFundingSummarySlice";
import ApplicationContext from "../../applicationContext/ApplicationContext";

export const getPortfolioAndSetState = (portfolioId) => {
    return async (dispatch, getState) => {
        const returnedPortfolio = await getPortfolio(portfolioId);
        dispatch(setPortfolio(returnedPortfolio));
    };
};

export const getBudgetLineItems = async ({ portfolioId, fiscalYear }) => {
    const responseData = await ApplicationContext.get()
        .helpers()
        .callBackend("/ops/budget-line-items", "get", {}, { portfolio_id: portfolioId, fiscal_year: fiscalYear });
    return responseData;
};

export const getBudgetLineItemsAndSetState = (portfolioId) => {
    return async (dispatch, getState) => {
        const returnedBudgetLineItems = await getBudgetLineItems(portfolioId);
        dispatch(setBudgetLineItems(returnedBudgetLineItems));
    };
};
