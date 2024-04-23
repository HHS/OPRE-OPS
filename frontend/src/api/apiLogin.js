import ApplicationContext from "../applicationContext/ApplicationContext";

export const apiLogin = async (provider, authCode) => {
    return await ApplicationContext.get().helpers().callBackend(`/auth/login/`, "post", {
        callbackUrl: window.location.href,
        code: authCode,
        provider: provider
    });
};

export const apiLogout = async () => {
    return await ApplicationContext.get().helpers().callBackend(`/auth/logout/`, "post", {});
};
