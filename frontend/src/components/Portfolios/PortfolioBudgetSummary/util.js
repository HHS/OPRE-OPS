import { getPortfolio } from "../../../pages/portfolios/detail/getPortfolio";
import { setPortfolio, setPortfolioBudget } from "./portfolioBudgetSummarySlice";
import ApplicationContext from "../../../applicationContext/ApplicationContext";

export const getPortfolioAndSetState = (portfolioId) => {
    return async (dispatch) => {
        const returnedPortfolio = await getPortfolio(portfolioId);
        dispatch(setPortfolio(returnedPortfolio));
    };
};

export const getPortfolioFundingAndSetState = (portfolioId, fiscalYear) => {
    return async (dispatch) => {
        const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;

        const data = await ApplicationContext.get()
            .helpers()
            .callBackend(
                `/api/${api_version}/portfolios/${portfolioId}/calcFunding/`,
                "get",
                {},
                { fiscal_year: fiscalYear },
            );

        dispatch(setPortfolioBudget(data));
    };
};
