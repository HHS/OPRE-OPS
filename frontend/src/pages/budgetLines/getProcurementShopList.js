import ApplicationContext from "../../applicationContext/ApplicationContext";

export const getProcurementShopList = async () => {
    const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
    const endpoint = `/api/${api_version}/procurement_shops/`;
    const responseData = await ApplicationContext.get().helpers().callBackend(endpoint, "get");
    return responseData;
};
