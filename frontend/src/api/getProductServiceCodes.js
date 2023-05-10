import ApplicationContext from "../applicationContext/ApplicationContext";

export const getProductServiceCodeById = async (id) => {
    const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
    const endpoint = `/api/${api_version}/product-service-codes/${id}`;
    const responseData = await ApplicationContext.get().helpers().callBackend(endpoint, "get");
    return responseData;
};
