import axios from "axios";
import { getAccessToken, getRefreshToken } from "../components/Auth/auth";

// const BACKEND_DOMAIN = import.meta.env.VITE_BACKEND_DOMAIN;
// Adding optional runtime config.
const BACKEND_DOMAIN = window.__RUNTIME_CONFIG__?.REACT_APP_BACKEND_DOMAIN || import.meta.env.VITE_BACKEND_DOMAIN;

export const callBackend = async (urlPath, action, requestBody, queryParams, useRefresh = false) => {
    console.debug(
        `Calling backend at ${BACKEND_DOMAIN}${urlPath} ${
            queryParams ? "with params:" + JSON.stringify(queryParams) : ""
        }`
    );

    const accessToken = useRefresh ? getRefreshToken() : getAccessToken();
    if (accessToken) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    }

    const response = await axios({
        method: action,
        url: `${BACKEND_DOMAIN}${urlPath}`,
        data: requestBody,
        params: queryParams,
        withCredentials: true
    });

    return response.data;
};

export const authConfig = {
    hhsams: {
        auth_endpoint:
            import.meta.env.VITE_HHSAMS_AUTH_ENDPOINT ||
            "https://sso-stage.acf.hhs.gov/auth/realms/ACF-SSO/protocol/openid-connect/auth",
        client_id: import.meta.env.VITE_HHSAMS_CLIENT_ID || "44fe2c7a-e9c5-43ec-87e9-3de78d2d3a11",
        response_type: "code",
        scope: "openid profile email",
        redirect_uri: `${window.location.origin}/login`,
        acr_values: 1,
        logout_endpoint:
            import.meta.env.VITE_HHSAMS_LOGOUT_ENDPOINT ||
            "https://sso-stage.acf.hhs.gov/auth/realms/ACF-SSO/protocol/openid-connect/logout"
    },
    logingov: {
        auth_endpoint: "https://idp.int.identitysandbox.gov/openid_connect/authorize",
        client_id: "urn:gov:gsa:openidconnect.profiles:sp:sso:hhs_acf:opre_ops",
        response_type: "code",
        scope: "openid email",
        redirect_uri: `${window.location.origin}/login`,
        acr_values: "http://idmanagement.gov/ns/assurance/ial/1",
        logout_endpoint: "https://idp.int.identitysandbox.gov/openid_connect/logout"
    }
};

export const backEndConfig = {
    apiVersion: "v1",
    publicKey: ""
};
