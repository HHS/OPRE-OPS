/* eslint-disable prettier/prettier */
import ApplicationContext from "../applicationContext/ApplicationContext";

export const getCanFundingSummary = async (id, fiscalYear) => {
    if (id && fiscalYear) {
        const responseData = await ApplicationContext.get()
            .helpers()
            .callBackend(`/api/v1/can-funding-summary/${id}/?fiscal_year=${fiscalYear}`, "get");
        return responseData;
    }
};

export const getPortfolioCans = async (id) => {
    const responseData = await ApplicationContext.get()
        .helpers()
        .callBackend(`/api/v1/portfolios/${id}/cans`, "get");
    return responseData;
};
