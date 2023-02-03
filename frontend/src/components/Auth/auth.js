import ApplicationContext from "../../applicationContext/ApplicationContext";
import cryptoRandomString from "crypto-random-string";

const authConfig = ApplicationContext.get().helpers().authConfig;

export const getAuthorizationCode = (stateToken) => {
    const providerUrl = new URL(authConfig.loginGovAuthorizationEndpoint);
    providerUrl.searchParams.set("acr_values", authConfig.acr_values);
    providerUrl.searchParams.set("client_id", authConfig.client_id);
    providerUrl.searchParams.set("response_type", authConfig.response_type);
    providerUrl.searchParams.set("scope", authConfig.scope);
    providerUrl.searchParams.set("redirect_uri", authConfig.redirect_uri);
    providerUrl.searchParams.set("state", stateToken);
    providerUrl.searchParams.set("nonce", cryptoRandomString({ length: 64 }));
    return providerUrl;
};
