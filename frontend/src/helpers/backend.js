import axios from "axios";

const BACKEND_DOMAIN = process.env.REACT_APP_BACKEND_DOMAIN;

export const callBackend = async (urlPath, action, requestBody) => {
    console.log(`Calling backend at ${urlPath}`);

    const response = await axios({
        method: action,
        url: `${BACKEND_DOMAIN}${urlPath}`,
        data: requestBody,
        headers: {
            Authorization: localStorage.getItem("access_token") ? `JWT ${localStorage.getItem("access_token")}` : null,
            "Content-Type": "application/json",
            accept: "application/json",
        },
    });

    return response.data;
};

export const authConfig = {
    loginGovAuthorizationEndpoint: "https://idp.int.identitysandbox.gov/openid_connect/authorize",
    acr_values: "http://idmanagement.gov/ns/assurance/ial/1",
    client_id: "urn:gov:gsa:openidconnect.profiles:sp:sso:hhs_acf:opre_ops",
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: "http://192.168.13.177:3000",
};
