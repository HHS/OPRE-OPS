import { faArrowRightToBracket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import cryptoRandomString from "crypto-random-string";
import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useLoginMutation, useLogoutMutation } from "../../api/opsAuthAPI";
import User from "../UI/Header/User";
import NotificationCenter from "../UI/NotificationCenter/NotificationCenter";
import { getAccessToken, getAuthorizationCode, setActiveUser } from "./auth";
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

        // Check for authentication code in URL first - this should take priority
        const queryParams = new URLSearchParams(window.location.search);
        const localStateString = localStorage.getItem("ops-state-key");

        // Process auth callback before doing any other auth checks
        if (queryParams.has("state") && queryParams.has("code") && localStateString) {
            const returnedState = queryParams.get("state");
            const authCode = queryParams.get("code");

            console.log(`Processing auth callback with code: ${authCode}`);
            localStorage.removeItem("ops-state-key");

            if (localStateString !== returnedState) {
                console.error("State mismatch:", { localStateString, returnedState });
                throw new Error("Response from OIDC provider is invalid.");
            } else if (authCode) {
                // Handle the code immediately, no need to check tokens first
                callBackend(authCode).catch((error) => {
                    console.error("Error in callBackend:", error);
                    dispatch(logout());
                    navigate("/login");
                });

                // Exit early - don't run the ensureActiveUser logic during auth callback
                return;
            }
        }

        // Only run token validation if we're not processing an auth callback
        const ensureActiveUser = async () => {
            if (currentJWT && !activeUser) {
                try {
                    dispatch(login());
                    await setActiveUser(currentJWT, dispatch);
                } catch (error) {
                    console.error("Failed to set active user:", error);
                    dispatch(logout());
                    navigate("/login");
                }
            }
            if (!currentJWT) {
                dispatch(logout());
                navigate("/login");
            }
        };

        ensureActiveUser();

        // Set state token if none exists
        if (!localStateString && !queryParams.has("code")) {
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
