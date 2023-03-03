import ApplicationContext from "../../applicationContext/ApplicationContext";
import cryptoRandomString from "crypto-random-string";
import { useSelector } from "react-redux";

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

export const logoutUser = async (stateToken) => {
    // As documented here: https://developers.login.gov/oidc/
    // Example:
    //
    // https://idp.int.identitysandbox.gov/openid_connect/logout?
    //   client_id=${CLIENT_ID}&
    //   post_logout_redirect_uri=${REDIRECT_URI}&
    //   state=abcdefghijklmnopabcdefghijklmnop
    const providerLogout = new URL(authConfig.loginGovLogoutEndpoint);
    providerLogout.searchParams.set("client_id", authConfig.client_id);
    providerLogout.searchParams.set("post_logout_redirect_uri", window.location.hostname);
    providerLogout.searchParams.set("state", stateToken);
    return providerLogout;
};

export const CheckAuth = () => {
    // TODO: We'll most likely want to include multiple checks here to determine if
    // the user is correctly authenticated and authorized. Hook into the Auth service
    // at some point.
    // const isLoggedIn = useSelector((state) => state.auth.isLoggedIn) || false;
    const tokenExists = localStorage.getItem("access_token");
    // TODO: Verify access_token's signature
    // TODO: Verify access_token's claims
    // TODO: Verify access_token's expiration - maybe perform a refresh()?
    // TODO: Check Authorization
    return tokenExists; // && payload;
};
