/* eslint-disable prettier/prettier */
import ApplicationContext from "../applicationContext/ApplicationContext";

export const getCanFundingSummary = async (id, fiscalYear) => {
    if (id && fiscalYear) {
        const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
        const responseData = await ApplicationContext.get()
            .helpers()
            .callBackend(`/api/${api_version}/can-funding-summary/${id}?fiscal_year=${fiscalYear}`, "get");
        return responseData;
    }
};

export const getPortfolioCans = async (id) => {
    const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
    const responseData = await ApplicationContext.get()
        .helpers()
        .callBackend(`/api/${api_version}/portfolios/${id}/cans`, "get");
    return responseData;
};
