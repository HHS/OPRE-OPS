import { setPortfolioCans } from "./portfolioDetailSlice";
import ApplicationContext from "../../../applicationContext/ApplicationContext";

export const getPortfolioCans = async (id) => {
    const responseData = await ApplicationContext.get().helpers().callBackend(`/ops/cans/portfolio/${id}`, "get");
    return responseData;
};

export const getPortfolioCansAndSetState = (id) => {
    return async (dispatch, getState) => {
        const responseData = await getPortfolioCans(id);
        dispatch(setPortfolioCans(responseData));
    };
};
