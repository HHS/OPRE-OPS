import ApplicationContext from "../applicationContext/ApplicationContext";
import { normalizeUser } from "../helpers/users.helpers";

export const getUser = async (id) => {
    const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
    const responseData = await ApplicationContext.get().helpers().callBackend(`/api/${api_version}/users/${id}`, "get");
    return normalizeUser(responseData);
};

export const getUserByOidc = async (oidc_id) => {
    const api_version = ApplicationContext.get().helpers().backEndConfig.apiVersion;
    const responseData = await ApplicationContext.get()
        .helpers()
        .callBackend(`/api/${api_version}/users/?oidc_id=${oidc_id}`, "get");
    return Array.isArray(responseData) ? responseData.map(normalizeUser) : normalizeUser(responseData);
};
