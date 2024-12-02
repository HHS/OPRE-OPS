import ApplicationContext from "../applicationContext/ApplicationContext";

export const getPortfolioCansFundingDetails = async (item) => {
    if (item.id && item.fiscalYear) {
        const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
        const responseData = await ApplicationContext.get()
            .helpers()
            .callBackend(`/api/${api_version}/can-funding-summary?can_ids=${item.id}?fiscal_year=${item.fiscalYear}`, "get");
        return responseData;
    }
    return {};
};
