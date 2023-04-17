import ApplicationContext from "../applicationContext/ApplicationContext";

export const getAllAgreements = async () => {
    const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
    const endpoint = `/api/${api_version}/agreements/`;
    const responseData = await ApplicationContext.get().helpers().callBackend(endpoint, "get");
    return responseData;
};

export const getAgreementsByResearchProjectFilter = async (id) => {
    const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
    const endpoint = `/api/${api_version}/agreements/?project_id=${id}`;
    const responseData = await ApplicationContext.get().helpers().callBackend(endpoint, "get");
    return responseData;
};

export const getAgreementTypes = async () => {
    const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
    const endpoint = `/api/${api_version}/agreement-types/`;
    const responseData = await ApplicationContext.get().helpers().callBackend(endpoint, "get");
    return responseData;
};
