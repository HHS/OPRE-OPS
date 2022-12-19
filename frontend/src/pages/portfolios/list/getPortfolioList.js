import { setPortfolioList } from "./portfolioListSlice";
import ApplicationContext from "../../../applicationContext/ApplicationContext";

export const getPortfolioList = () => {
    return async (dispatch, getState) => {
        const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
        const responseData = await ApplicationContext.get()
            .helpers()
            .callBackend(`/api/${api_version}/portfolios`, "get");
        dispatch(setPortfolioList(responseData));
    };
};
