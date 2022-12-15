import ApplicationContext from "../applicationContext/ApplicationContext";

export const getPortfolioCansFundingDetails = async (item) => {
    if (item.id) {
        const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
        const responseData = await ApplicationContext.get()
            .helpers()
            .callBackend(`/api/${api_version}/can-funding-summary/${item.id}?fiscal_year=${item.fiscalYear}`, "get");
        return responseData;
    }
    return {};
};
