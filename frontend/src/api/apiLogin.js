import ApplicationContext from "../applicationContext/ApplicationContext";

export const apiLogin = async (provider, authCode) => {
    return await ApplicationContext.get().helpers().callBackend(`/auth/login/`, "post", {
        code: authCode,
        provider: provider
    });
};

export const apiLogout = async () => {
    return await ApplicationContext.get().helpers().callBackend(`/auth/logout/`, "post", {});
};
