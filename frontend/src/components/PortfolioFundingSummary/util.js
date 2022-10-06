import { getPortfolio } from "../../pages/portfolios/detail/getPortfolio";
import { setPortfolio, setPortfolioFunding } from "./portfolioFundingSummarySlice";
import ApplicationContext from "../../applicationContext/ApplicationContext";

export const getPortfolioAndSetState = (portfolioId) => {
    return async (dispatch, getState) => {
        const returnedPortfolio = await getPortfolio(portfolioId);
        dispatch(setPortfolio(returnedPortfolio));
    };
};

export const getPortfolioFundingAndSetState = (portfolioId, fiscalYear) => {
    return async (dispatch, getState) => {
        const data = await ApplicationContext.get()
            .helpers()
            .callBackend(`/ops/portfolios/${portfolioId}/calcFunding`, "get", {}, { fiscal_year: fiscalYear });

        dispatch(setPortfolioFunding(data));
    };
};
