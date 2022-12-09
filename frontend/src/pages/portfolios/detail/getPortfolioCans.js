import { setPortfolioCans, setPortfolioCansFundingDetails } from "./portfolioDetailSlice";
import { getPortfolioCans } from "../../../helpers/api";
import ApplicationContext from "../../../applicationContext/ApplicationContext";

export const getPortfolioCansAndSetState = (id) => {
    return async (dispatch, getState) => {
        const responseData = await getPortfolioCans(id);
        dispatch(setPortfolioCans(responseData));
    };
};

export const getPortfolioCansFundingDetailsAndSetState = (id, fiscalYear) => {
    return async (dispatch, getState) => {
        if (id && fiscalYear) {
            const responseData = await ApplicationContext.get()
                .helpers()
                .callBackend(`/ops/fundingSummary?can_id=${id}&fiscal_year=${fiscalYear}`, "get");
            dispatch(setPortfolioCansFundingDetails(responseData));
        }
    };
};
