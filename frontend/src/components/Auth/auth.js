import cryptoRandomString from "crypto-random-string";
import { jwtDecode } from "jwt-decode";
import { getUserByOidc } from "../../api/getUser";
import ApplicationContext from "../../applicationContext/ApplicationContext";
import { logout, setUserDetails } from "../Auth/authSlice";
import { postRefresh } from "../../api/postRefresh.js";

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
 * @returns {boolean} Returns true if the user is authenticated and authorized, otherwise false.
 */
export const CheckAuth = () => {
    const tokenExists = getAccessToken() !== null;
    return tokenExists;
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
    if (!token) {
        console.error("No token provided to setActiveUser");
        return;
    }

    try {
        const decodedJwt = jwtDecode(token);
        const userId = decodedJwt["sub"];
        const userDetails = await getUserByOidc(userId);

        if (userDetails.length !== 0) {
            dispatch(setUserDetails(userDetails.pop()));
        }
    } catch (error) {
        console.error("Error setting active user:", error);
        dispatch(logout());
        window.location.href = "/login";
    }
}

/**
 * Retrieves the access token.
 * @returns {string|null} The access token, or null if it is not found or invalid.
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
        // Token is expired, but we'll return null and let the RTK Query middleware handle refresh
        postRefresh().then((response) => {
            return response.access_token;
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
    return localStorage.getItem("refresh_token");
};

/**
 * Checks if the access token is valid by decoding the JWT and comparing the expiration time with the current time.
 * @param {string} token - The token to validate
 * @returns {TokenValidationStatus} Returns a TokenValidationStatus object with isValid and msg properties.
 */
export const isValidToken = (token) => {
    if (!token) {
        return new TokenValidationStatus(false, "NOT_FOUND");
    }

    try {
        const decodedJwt = jwtDecode(token);

        // Check expiration time
        const exp = decodedJwt["exp"];
        const now = Date.now() / 1000;
        if (exp < now) {
            return new TokenValidationStatus(false, "EXPIRED");
        }

        // Check issuer
        const issuer = decodedJwt["iss"];
        // TODO: Update this when we have a real issuer value
        if (issuer !== "https://opre-ops-backend-dev") {
            return new TokenValidationStatus(false, "ISSUER");
        }

        return new TokenValidationStatus(true, "VALID");
    } catch (error) {
        console.error("Error validating token:", error);
        return new TokenValidationStatus(false, "INVALID");
    }
};
