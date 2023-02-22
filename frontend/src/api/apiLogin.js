import ApplicationContext from "../applicationContext/ApplicationContext";

export const apiLogin = async (authCode) => {
    const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;

    const responseData = await ApplicationContext.get()
        .helpers()
        .callBackend(`/api/${api_version}/auth/login/`, "post", {
            callbackUrl: window.location.href,
            code: authCode,
        });
    return responseData;
};
