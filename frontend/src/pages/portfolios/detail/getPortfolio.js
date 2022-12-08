import { setPortfolio } from "./portfolioDetailSlice";
import ApplicationContext from "../../../applicationContext/ApplicationContext";

export const getPortfolio = async (id) => {
    const responseData = await ApplicationContext.get().helpers().callBackend(`/api/v1/portfolios/${id}`, "get");
    return responseData;
};

export const getPortfolioAndSetState = (id) => {
    return async (dispatch, getState) => {
        const responseData = await getPortfolio(id);
        dispatch(setPortfolio(responseData));
    };
};
