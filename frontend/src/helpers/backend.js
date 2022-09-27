import axios from "axios";

const BACKEND_DOMAIN = process.env.REACT_APP_BACKEND_DOMAIN;

export const callBackend = async (urlPath, action, requestBody) => {
    console.log(`Calling backend at ${urlPath}`);

    const response = await axios({
        method: action,
        url: `${BACKEND_DOMAIN}${urlPath}`,
        data: requestBody,
    });

    return response.data;
};

export const authConfig = {
    loginGovAuthorizationEndpoint: "https://idp.int.identitysandbox.gov/openid_connect/authorize",
    acr_values: "http://idmanagement.gov/ns/assurance/ial/1",
    client_id: "urn:gov:gsa:openidconnect.profiles:sp:sso:hhs_acf:opre_ops",
    response_type: "code",
    scope: "openid email",
    redirect_uri: "http://localhost:3000",
};
