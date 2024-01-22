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
        auth_endpoint: "https://sso-stage.acf.hhs.gov/auth/realms/ACF-SSO/protocol/openid-connect/auth",
        client_id: "44fe2c7a-e9c5-43ec-87e9-3de78d2d3a11",
        response_type: "code",
        scope: "openid profile email",
        redirect_uri: `${window.location.origin}/login`,
        acr_values: 1,
        logout_endpoint: "https://sso-stage.acf.hhs.gov/auth/realms/ACF-SSO/protocol/openid-connect/logout"
    },
    logingov: {
        auth_endpoint: "https://idp.int.identitysandbox.gov/openid_connect/authorize",
        client_id: "urn:gov:gsa:openidconnect.profiles:sp:sso:hhs_acf:opre_ops",
        response_type: "code",
        scope: "openid email",
        redirect_uri: `${window.location.origin}/login`,
        acr_values: "http://idmanagement.gov/ns/assurance/ial/1",
        logout_endpoint: "https://idp.int.identitysandbox.gov/openid_connect/logout"
    },
    azureb2c: {
        // eslint-disable-next-line prettier/prettier
        auth_endpoint: "https://opreops.b2clogin.com/opreops.onmicrosoft.com/B2C_1_OPRE-OPS-FLEXION-SIGN-IN/oauth2/v2.0/authorize",
        client_id: "3948e2a2-f0ea-444c-9ebc-c40c1de66698",
        response_type: "code",
        scope: "https://opreops.onmicrosoft.com/3948e2a2-f0ea-444c-9ebc-c40c1de66698",
        redirect_uri: "http://localhost:3000/login",
        acr_values: "",
        logout_endpoint: ""
    }
    /*
        https://opreops.b2clogin.com/opreops.onmicrosoft.com/B2C_1_OPRE-OPS-FLEXION-SIGN-IN/oauth2/v2.0/authorize?client_id=3948e2a2-f0ea-444c-9ebc-c40c1de66698&nonce=585864647272&redirect_uri=https://jwt.ms&scope=https://opreops.onmicrosoft.com/3948e2a2-f0ea-444c-9ebc-c40c1de66698&response_type=code

    */
};

export const backEndConfig = {
    apiVersion: "v1",
    publicKey: ""
};
