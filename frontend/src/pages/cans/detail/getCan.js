import ApplicationContext from "../../../applicationContext/ApplicationContext";

export const getCan = async (id) => {
    const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
    const responseData = await ApplicationContext.get().helpers().callBackend(`/api/${api_version}/cans/${id}`, "get");
    return responseData;
};
