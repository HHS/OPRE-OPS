/* eslint-disable prettier/prettier */
import ApplicationContext from "../applicationContext/ApplicationContext";

export const getCanFundingSummary = async (id, fiscalYear) => {
    if (id && fiscalYear) {
        const responseData = await ApplicationContext.get()
            .helpers()
            .callBackend(`/ops/fundingSummary?can_id=${id}&fiscal_year=${fiscalYear}`, "get");
        return responseData;
    }
};

export const getPortfolioCans = async (id) => {
    const responseData = await ApplicationContext.get()
        .helpers()
        .callBackend(`/ops/portfolios/${id}/cans`, "get");
    return responseData;
};
