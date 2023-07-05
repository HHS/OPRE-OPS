import axios from "axios";

const BACKEND_DOMAIN = process.env.VITE_BACKEND_DOMAIN;

export const callBackend = async (urlPath, action, requestBody, queryParams) => {
    console.log(`Calling backend at ${urlPath} ${queryParams ? "with params:" + JSON.stringify(queryParams) : ""}`);

    if (localStorage.getItem("access_token"))
        axios.defaults.headers.common["Authorization"] = `Bearer ${localStorage.getItem("access_token")}`;

    const response = await axios({
        method: action,
        url: `${BACKEND_DOMAIN}${urlPath}`,
        data: requestBody,
        params: queryParams,
    });

    return response.data;
};

export const authConfig = {
    loginGovAuthorizationEndpoint: "https://idp.int.identitysandbox.gov/openid_connect/authorize",
    acr_values: "http://idmanagement.gov/ns/assurance/ial/1",
    client_id: "urn:gov:gsa:openidconnect.profiles:sp:sso:hhs_acf:opre_ops",
    response_type: "code",
    scope: "openid email",
    redirect_uri: window.location.origin,
    logoutEndpoint: "https://idp.int.identitysandbox.gov/openid_connect/logout",
};

export const backEndConfig = {
    apiVersion: "v1",
    publicKey: "",
};
