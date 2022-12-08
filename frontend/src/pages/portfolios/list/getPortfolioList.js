import { setPortfolioList } from "./portfolioListSlice";
import ApplicationContext from "../../../applicationContext/ApplicationContext";

export const getPortfolioList = () => {
    return async (dispatch, getState) => {
        const responseData = await ApplicationContext.get().helpers().callBackend("/api/v1/portfolios", "get");
        dispatch(setPortfolioList(responseData));
    };
};
