import ApplicationContext from "../../applicationContext/ApplicationContext";

const authConfig = ApplicationContext.get().helpers().authConfig;

export const getAuthorizationCode = (stateToken) => {
    const providerUrl = new URL(authConfig.loginGovAuthorizationEndpoint);
    providerUrl.searchParams.set("acr_values", "http://idmanagement.gov/ns/assurance/ial/1");
    providerUrl.searchParams.set("client_id", "urn:gov:gsa:openidconnect.profiles:sp:sso:hhs_acf:opre_ops_jwt");
    providerUrl.searchParams.set("response_type", "code");
    providerUrl.searchParams.set("scope", "openid email");
    providerUrl.searchParams.set("redirect_uri", "http://localhost:3001/login-jwt");
    providerUrl.searchParams.set("state", stateToken);
    providerUrl.searchParams.set("nonce", stateToken);
    return providerUrl;
};
