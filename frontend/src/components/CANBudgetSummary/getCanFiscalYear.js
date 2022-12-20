import { setCanFiscalYear, setPendingFunds } from "../../store/canDetailSlice";
import ApplicationContext from "../../applicationContext/ApplicationContext";
import constants from "../../constants";

export const getCanFiscalYearByCan = (can_id, fiscal_year) => {
    return async (dispatch, getState) => {
        const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
        const responseData = await ApplicationContext.get()
            .helpers()
            .callBackend(`/api/${api_version}/can-fiscal-year/?can_id=${can_id}&year=${fiscal_year}`, "get");

        const canFiscalYear = responseData[0];
        if (canFiscalYear) {
            dispatch(setCanFiscalYear(canFiscalYear));
        } else {
            dispatch(setCanFiscalYear({}));
        }

        if (!canFiscalYear || !canFiscalYear.total_fiscal_year_funding || !canFiscalYear.amount_available) {
            dispatch(setPendingFunds(constants.notFilledInText));
            return;
        }

        dispatch(setPendingFunds(canFiscalYear.total_fiscal_year_funding - canFiscalYear.amount_available));
    };
};
