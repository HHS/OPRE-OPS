import { setPortfolioCans } from "./portfolioDetailSlice";
import { getPortfolioCans } from "../../../helpers/api";

export const getPortfolioCansAndSetState = (id) => {
    return async (dispatch, getState) => {
        const responseData = await getPortfolioCans(id);
        dispatch(setPortfolioCans(responseData));
    };
};
