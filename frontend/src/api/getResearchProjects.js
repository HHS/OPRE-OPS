import ApplicationContext from "../applicationContext/ApplicationContext";

export const getResearchProjects = async (portfolioId, fiscalYear) => {
    const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
    const responseData = await ApplicationContext.get()
        .helpers()
        .callBackend(
            `/api/${api_version}/research-projects/?portfolio_id=${portfolioId}&fiscal_year=${fiscalYear}`,
            "get"
        );
    return responseData;
};
