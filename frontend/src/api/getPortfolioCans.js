import { setPortfolioCans, setPortfolioCansFundingDetails } from "../store/portfolioDetailSlice";
import { getPortfolioCans } from "../helpers/api";
import ApplicationContext from "../applicationContext/ApplicationContext";

export const getPortfolioCansAndSetState = (id) => {
    return async (dispatch, getState) => {
        const responseData = await getPortfolioCans(id);
        dispatch(setPortfolioCans(responseData));
    };
};

export const getPortfolioCansFundingDetailsAndSetState = async (item) => {
    if (item.id) {
        const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
        const responseData = await ApplicationContext.get()
            .helpers()
            .callBackend(`/api/${api_version}/can-funding-summary/${item.id}?fiscal_year=${item.fiscalYear}`, "get");
        return responseData;
    }
    return {};
};

export const getPortfolioCansFundingDetails = (canData) => {
    return async (dispatch, getState) => {
        const result = await Promise.all(canData.map(getPortfolioCansFundingDetailsAndSetState));
        dispatch(setPortfolioCansFundingDetails(result));
    };
};
