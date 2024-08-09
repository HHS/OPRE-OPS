import ApplicationContext from "../applicationContext/ApplicationContext";

export const postDocument = async (data) => {
    const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
    return await ApplicationContext.get().helpers().callBackend(
        `/api/${api_version}/documents/`,
        "post",
        {...data}
    );
};
