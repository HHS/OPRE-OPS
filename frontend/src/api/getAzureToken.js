import ApplicationContext from "../applicationContext/ApplicationContext";

export const getAzureSasToken = async () => {
    const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
    const responseData = await ApplicationContext.get()
        .helpers()
        .callBackend(`/api/${api_version}/azure/sas-token/`, "get");

    if (!responseData || !responseData["sas_token"]) {
        throw new Error("Failed to get Azure SAS token");
    }
    return responseData["sas_token"];
};
