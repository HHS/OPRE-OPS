import { setPortfolio } from "../store/portfolioDetailSlice";
import ApplicationContext from "../applicationContext/ApplicationContext";

export const getPortfolio = async (id) => {
    const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
    const responseData = await ApplicationContext.get()
        .helpers()
        .callBackend(`/api/${api_version}/portfolios/${id}`, "get");
    return responseData;
};

export const getPortfolioAndSetState = (id) => {
    return async (dispatch, getState) => {
        const responseData = await getPortfolio(id);
        dispatch(setPortfolio(responseData));
    };
};
