import ApplicationContext from "../../../applicationContext/ApplicationContext";

export const getResearchFunding = async (portfolioId, fiscalYear) => {
    const queryParams = {
        portfolioId: portfolioId,
        fiscalYear: fiscalYear
    };

    const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
    const responseData = await ApplicationContext.get()
        .helpers()
        .callBackend(`/api/${api_version}/research-project-funding-summary/`, "get", {}, queryParams);
    return responseData;
};
