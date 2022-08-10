import { setCfy } from "./canFiscalYearSlice";
import ApplicationContext from "../../../applicationContext/ApplicationContext";

export const getCfy = (id) => {
    return async (dispatch, getState) => {
        const resonseData = await ApplicationContext.get().helpers().callBackend(`/ops/cfy/${id}`, "get");
        dispatch(setCfy(resonseData));
    };
};

export const getCfyByCan = (can_id, fiscal_year) => {
    return async (dispatch, getState) => {
        const responseData = await ApplicationContext.get()
            .helpers()
            .callBackend(`/ops/cfys/${can_id}/${fiscal_year}`, "get");
        dispatch(setCfy(responseData));
    };
};
