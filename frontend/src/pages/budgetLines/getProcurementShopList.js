import ApplicationContext from "../../applicationContext/ApplicationContext";

export const getProcurementShopList = async () => {
    const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
    const endpoint = `/api/${api_version}/procurement-shops/`;
    const responseData = ApplicationContext.get().helpers().callBackend(endpoint, "get");
    return responseData;
};
