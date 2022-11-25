import { setCanTotalFunding } from "./canCardDetailSlice";
import ApplicationContext from "../../applicationContext/ApplicationContext";

export const getCanTotalFundingandSetState = (id, fiscalYear) => {
    return async (dispatch, getState) => {
        const responseData = await ApplicationContext.get()
            .helpers()
            .callBackend(`/ops/can-fiscal-year/${id}/${fiscalYear}`, "get");
        dispatch(setCanTotalFunding(responseData));
    };
};
