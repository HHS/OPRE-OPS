import { faArrowRightToBracket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import cryptoRandomString from "crypto-random-string";
import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useLoginMutation, useLogoutMutation, useRefreshTokenMutation } from "../../api/opsAuthAPI";
import User from "../UI/Header/User";
import NotificationCenter from "../UI/NotificationCenter/NotificationCenter";
import { getAccessToken, getAuthorizationCode, getRefreshToken, isValidToken, setActiveUser } from "./auth";
import { login, logout } from "./authSlice";

/**
 * Authentication section component that handles login/logout functionality
 * @returns {React.ReactElement} The AuthSection component
 */
const AuthSection = () => {
    /** @type {boolean} */
    const isLoggedIn = useSelector((state) => state.auth?.isLoggedIn);
    /** @type {Object|null} */
    const activeUser = useSelector((state) => state.auth?.activeUser);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [loginMutation] = useLoginMutation();
    const [logoutMutation] = useLogoutMutation();
    const [refreshTokenMutation] = useRefreshTokenMutation();

    /**
     * Handles token refresh
     * @returns {Promise<boolean>} True if refresh was successful, false otherwise
     */
    const handleTokenRefresh = async () => {
        try {
            const refreshToken = getRefreshToken();
            if (!refreshToken) {
                return false;
            }

            const response = await refreshTokenMutation({
                refresh_token: refreshToken
            }).unwrap();
            if (response.access_token) {
                localStorage.setItem("access_token", response.access_token);
                if (response.refresh_token) {
                    localStorage.setItem("refresh_token", response.refresh_token);
                }
                await setActiveUser(response.access_token, dispatch);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error refreshing token:", error);
            return false;
        }
    };

    /**
     * Handles the authentication code callback from the provider
     * @param {string} authCode - The authorization code from the provider
     */
    const callBackend = useCallback(
        async (authCode) => {
            try {
                const activeProvider = localStorage.getItem("activeProvider") || "logingov";
                const response = await loginMutation({
                    provider: activeProvider,
                    code: authCode
                }).unwrap();

                if (response.access_token) {
                    localStorage.setItem("access_token", response.access_token);
                    localStorage.setItem("refresh_token", response.refresh_token);
                    dispatch(login());
                    if (!activeUser) await setActiveUser(response.access_token, dispatch);
                }
                navigate("/");
                // eslint-disable-next-line no-unused-vars
            } catch (error) {
                console.error("Error logging in");
                dispatch(logout());
                navigate("/login");
            }
        },
        [activeUser, dispatch, navigate, loginMutation]
    );

    useEffect(() => {
        const currentJWT = getAccessToken();
        const checkAndRefreshToken = async () => {
            if (!currentJWT) {
                navigate("/login");
                return;
            }

            const tokenStatus = isValidToken(currentJWT);

            if (!tokenStatus.isValid && tokenStatus.msg === "EXPIRED") {
                const refreshSuccessful = await handleTokenRefresh();
                if (!refreshSuccessful) {
                    dispatch(logout());
                    navigate("/login");
                    return;
                }
            }

            dispatch(login());
            if (!activeUser) await setActiveUser(currentJWT, dispatch);
        };

        checkAndRefreshToken();

        const localStateString = localStorage.getItem("ops-state-key");

        if (localStateString) {
            const queryParams = new URLSearchParams(window.location.search);

            // check if we have been redirected here from the OIDC provider
            if (queryParams.has("state") && queryParams.has("code")) {
                // check that the state matches
                const returnedState = queryParams.get("state");
                const localStateString = localStorage.getItem("ops-state-key");

                localStorage.removeItem("ops-state-key");

                if (localStateString !== returnedState) {
                    throw new Error("Response from OIDC provider is invalid.");
                } else {
                    const authCode = queryParams.get("code");
                    console.log(`Received Authentication Code = ${authCode}`);
                    if (authCode) {
                        callBackend(authCode).catch(console.error);
                    }
                }
            }
        } else {
            // first page load - generate state token and set on localStorage
            localStorage.setItem("ops-state-key", cryptoRandomString({ length: 64 }));
        }
    }, [activeUser, callBackend, dispatch, navigate]);

    /**
     * Handles user logout
     */
    const logoutHandler = async () => {
        try {
            // Use the RTK Query logout mutation
            await logoutMutation().unwrap();
            // The logout action is already dispatched in the onQueryStarted callback in opsAuthAPI.js
            await dispatch(logout());
            navigate("/login");
        } catch (error) {
            console.error("Error during logout:", error);
            // Still attempt to logout locally even if the API call fails
            await dispatch(logout());
            navigate("/login");
        }
        // TODO: ⬇ Logout from Auth Provider ⬇
        // const output = await logoutUser(localStorage.getItem("ops-state-key"));
        // console.log(output);
        // TODO: Add the current access_token's 'jti' to a revocation list, to prevent replay attacks
    };

    return (
        <div>
            {/* NOTE: Not sure this will ever render since we redirect to login page */}
            {!isLoggedIn && (
                <div id="auth-section">
                    <button
                        className="usa-button usa-button--unstyled margin-105"
                        onClick={() => {
                            const stateKey = localStorage.getItem("ops-state-key");
                            if (stateKey) {
                                window.location.href = getAuthorizationCode("logingov", stateKey).toString();
                            }
                        }}
                    >
                        <span
                            className="margin-1"
                            style={{ fontSize: "14px" }}
                        >
                            Sign-in
                        </span>
                        <FontAwesomeIcon icon={faArrowRightToBracket} />
                    </button>
                </div>
            )}
            {isLoggedIn && (
                <div id="auth-section">
                    <div className="display-flex flex-align-center">
                        <div className="padding-right-1">
                            <User user={activeUser} />
                        </div>
                        <span className="text-brand-primary">|</span>
                        <button
                            className="usa-button usa-button--unstyled margin-105"
                            onClick={logoutHandler}
                            data-cy="sign-out"
                        >
                            <span style={{ fontSize: "14px" }}>Sign-Out</span>
                        </button>
                        <div className="padding-right-205">
                            <NotificationCenter user={activeUser} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthSection;
