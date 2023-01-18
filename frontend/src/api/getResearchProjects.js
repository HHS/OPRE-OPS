import ApplicationContext from "../applicationContext/ApplicationContext";

export const getResearchProjects = async (portfolioId, fiscalYear) => {
    const queryParams = {
        portfolio_id: portfolioId,
        fiscal_year: fiscalYear,
    };

    const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
    const responseData = await ApplicationContext.get()
        .helpers()
        .callBackend(`/api/${api_version}/research-projects/`, "get", {}, queryParams);
    return responseData;
};
