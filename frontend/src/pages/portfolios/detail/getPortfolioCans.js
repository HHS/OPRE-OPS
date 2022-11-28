import { setPortfolioCans } from "./portfolioDetailSlice";
import ApplicationContext from "../../../applicationContext/ApplicationContext";

export const getPortfolioCans = async (id) => {
    const responseData = await ApplicationContext.get().helpers().callBackend(`/ops/portfolios/${id}/cans`, "get");
    return responseData;
};

// export const getPortfolioAndSetState = (id, fiscalYear) => async (dispatch) => {
//     const responseData = await getPortfolioBudgetDetailsByCan(id, fiscalYear);
//     dispatch(setPortfolioCans(responseData));
// };
export const getPortfolioCansAndSetState = (id) => {
    return async (dispatch, getState) => {
        const responseData = await getPortfolioCans(id);
        dispatch(setPortfolioCans(responseData));
    };
};
