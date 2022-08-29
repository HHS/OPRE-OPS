import { setPortfolio } from "./portfolioDetailSlice";
import ApplicationContext from "../../../applicationContext/ApplicationContext";

export const getPorfolio = (id) => {
    return async (dispatch, getState) => {
        const responseData = await ApplicationContext.get().helpers().callBackend(`/ops/portfolios/${id}`, "get");
        dispatch(setPortfolio(responseData));
    };
};
