import ApplicationContext from "../../applicationContext/ApplicationContext";
import cryptoRandomString from "crypto-random-string";
import { jwtDecode } from "jwt-decode";
import { getUserByOidc } from "../../api/getUser";
import { logout, setUserDetails } from "../Auth/authSlice";
import { callBackend } from "../../helpers/backend";
import store from "../../store";

/**
 * Represents the status of a token.
 */
class TokenValidationStatus {
    constructor(isValid, msg) {
        this.isValid = isValid;
        this.msg = msg;
    }
}

/**
 * Generates the authorization code URL for the specified provider and state token.
 * @function getAuthorizationCode
 * @param {string} provider - The name of the provider to generate the authorization code URL for.
 * @param {string} stateToken - The state token to include in the authorization code URL.
 * @returns {URL} The authorization code URL for the specified provider and state token.
 *
 * @example
 * const provider = "login.gov";
 * const stateToken = "12345";
 * const authUrl = getAuthorizationCode(provider, stateToken);
 */
export const getAuthorizationCode = (provider, stateToken) => {
    const authConfig = ApplicationContext.get().helpers().authConfig;
    const authProvider = authConfig[provider];
    const providerUrl = new URL(authProvider.auth_endpoint);
    providerUrl.searchParams.set("acr_values", authProvider.acr_values);
    providerUrl.searchParams.set("client_id", authProvider.client_id);
    providerUrl.searchParams.set("response_type", authProvider.response_type);
    providerUrl.searchParams.set("scope", authProvider.scope);
    providerUrl.searchParams.set("redirect_uri", authProvider.redirect_uri);
    providerUrl.searchParams.set("state", stateToken);
    providerUrl.searchParams.set("nonce", cryptoRandomString({ length: 64 }));
    return providerUrl;
};

/**
 * Logs out the user and returns the URL to redirect to for logout.
 * @param {string} stateToken - The state token to include in the logout URL.
 * @returns {URL} - The URL to redirect to for logout.
 */
export const logoutUser = async (stateToken) => {
    // As documented here: https://developers.login.gov/oidc/
    // Example:
    //
    // https://idp.int.identitysandbox.gov/openid_connect/logout?
    //   client_id=${CLIENT_ID}&
    //   post_logout_redirect_uri=${REDIRECT_URI}&
    //   state=abcdefghijklmnopabcdefghijklmnop
    const authConfig = ApplicationContext.get().helpers().authConfig;
    const providerLogout = new URL(authConfig.logout_endpoint);
    providerLogout.searchParams.set("client_id", authConfig.client_id);
    providerLogout.searchParams.set("post_logout_redirect_uri", window.location.hostname);
    providerLogout.searchParams.set("state", stateToken);
    return providerLogout;
};

/**
 * Checks if the user is authenticated and authorized.
 * @todo Implement token signature validation
 * @todo Implement token claims validation
 * @todo Implement token expiration validation
 * @todo Implement Authorization checks.
 * @returns {boolean} Returns true if the user is authenticated and authorized, otherwise false.
 */
export const CheckAuth = () => {
    // TODO: We'll most likely want to include multiple checks here to determine if
    // the user is correctly authenticated and authorized. Hook into the Auth service
    // at some point.
    // const isLoggedIn = useSelector((state) => state.auth.isLoggedIn) || false;
    const tokenExists = getAccessToken() !== null;
    // TODO: Verify access_token's signature
    // TODO: Verify access_token's claims
    // TODO: Verify access_token's expiration - maybe perform a refresh()?
    // TODO: Check Authorization
    return tokenExists; // && payload;
};

/**
 * Sets the active user details in the Redux store by decoding the JWT token and fetching user details from the API.
 * @async
 * @function setActiveUser
 * @param {string} token - The JWT token to decode and fetch user details.
 * @param {function} dispatch - The Redux dispatch function to set the user details in the store.
 * @returns {Promise<void>} A Promise that resolves when the user details are set in the store.
 *
 * @example
 * const token = "<token>";
 * const dispatch = useDispatch();
 * setActiveUser(token, dispatch);
 */
export async function setActiveUser(token, dispatch) {
    // TODO: Vefiry the Token!
    //const isValidToken = validateTooken(token);
    const decodedJwt = jwtDecode(token);
    const userId = decodedJwt["sub"];
    const userDetails = await getUserByOidc(userId);

    dispatch(setUserDetails(userDetails));
}

/**
 * Retrieves the access token.
 * @returns {string|null} The access token, or null if it is not found.
 *
 * @example
 * const accessToken = getAccessToken();
 */
export const getAccessToken = () => {
    const token = localStorage.getItem("access_token");
    const validToken = isValidToken(token);
    if (validToken.isValid) {
        return token;
    } else if (validToken.msg === "EXPIRED") {
        // lets try to get a new token
        // is the refresh token still valid?
        callBackend("/auth/refresh/", "POST", {}, null, true)
            .then((response) => {
                localStorage.setItem("access_token", response.access_token);
                return response.access_token;
            })
            .catch(() => {
                store.dispatch(logout());
            });
    } else {
        return null;
    }
};

/**
 * Retrieves the refresh token.
 * @returns {string|null} The refresh token, or null if it is not found.
 *
 * @example
 * const refreshToken = getRefreshToken();
 */
export const getRefreshToken = () => {
    const token = localStorage.getItem("refresh_token");
    return token;
};

/**
 * Checks if the access token is valid by decoding the JWT and comparing the expiration time with the current time.
 * @returns {boolean|str} Returns true if the access token is valid, false otherwise.
 */
export const isValidToken = (token) => {
    if (!token) {
        return new TokenValidationStatus(false, "NOT_FOUND");
    }

    const decodedJwt = jwtDecode(token);

    // Check expiration time
    const exp = decodedJwt["exp"];
    const now = Date.now() / 1000;
    if (exp < now) {
        return new TokenValidationStatus(false, "EXPIRED");
    }

    // TODO: Check signature
    // const signature = decodedJwt["signature"];
    // if (!verifySignature(token, signature)) {
    //     throw new InvalidSignatureException("Token signature is invalid");
    // }

    // Check issuer
    const issuer = decodedJwt["iss"];
    // TODO: Update this when we have a real issuer value
    if (issuer !== "https://opre-ops-backend-dev") {
        return new TokenValidationStatus(false, "ISSUER");
    }

    return new TokenValidationStatus(true, "VALID");
};
