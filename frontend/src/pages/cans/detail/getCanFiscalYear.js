import { setCanFiscalYear } from "./canFiscalYearSlice";
import ApplicationContext from "../../../applicationContext/ApplicationContext";

export const getCanFiscalYearByCan = (can_id, fiscal_year) => {
    return async (dispatch, getState) => {
        const responseData = await ApplicationContext.get()
            .helpers()
            .callBackend(`/ops/can-fiscal-year/${can_id}/${fiscal_year}`, "get");
        dispatch(setCanFiscalYear(responseData[0]));
    };
};
