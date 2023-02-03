import ApplicationContext from "../../../applicationContext/ApplicationContext";

export const getPortfolio = async (id) => {
    const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
    const responseData = await ApplicationContext.get()
        .helpers()
        .callBackend(`/api/${api_version}/portfolios/${id}`, "get");
    return responseData;
};

export const getPortfolioCans = async (id, year) => {
    const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
    const responseData = await ApplicationContext.get()
        .helpers()
        .callBackend(`/api/${api_version}/portfolios/${id}/cans/?year=${year}`, "get");
    return responseData;
};
