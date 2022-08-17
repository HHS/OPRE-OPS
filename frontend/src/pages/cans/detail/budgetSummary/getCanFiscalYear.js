import { setCanFiscalYear, setPendingFunds } from "./canFiscalYearSlice";
import ApplicationContext from "../../../../applicationContext/ApplicationContext";
import constants from "../../../../constants";

export const getCanFiscalYearByCan = (can_id, fiscal_year) => {
    return async (dispatch, getState) => {
        const responseData = await ApplicationContext.get()
            .helpers()
            .callBackend(`/ops/can-fiscal-year/${can_id}/${fiscal_year}`, "get");

        const canFiscalYear = responseData[0];
        dispatch(setCanFiscalYear(canFiscalYear));

        if (!canFiscalYear) {
            dispatch(setPendingFunds(constants.notFilledInText));
            return;
        }

        dispatch(setPendingFunds(canFiscalYear.total_fiscal_year_funding - canFiscalYear.amount_available));
    };
};
