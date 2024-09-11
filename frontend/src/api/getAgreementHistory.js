import ApplicationContext from "../applicationContext/ApplicationContext";

export const getAgreementHistoryByIdAndPage = async (id, page) => {
    const pageSize = 20;
    const limit = pageSize;
    const offset = pageSize * (page - 1);
    const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
    const endpoint = `/api/${api_version}/agreement-history/${id}?limit=${limit}&offset=${offset}`;
    const responseData = await ApplicationContext.get().helpers().callBackend(endpoint, "get");
    return responseData;
};
