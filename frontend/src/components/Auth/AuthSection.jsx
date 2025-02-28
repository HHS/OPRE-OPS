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
    // Use type assertion in the selector to fix TypeScript errors
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

        if (currentJWT) {
            // TODO: we should validate the JWT here and set it on state if valid else logout
            dispatch(login());
            if (!activeUser) setActiveUser(currentJWT, dispatch);
            return;
        } else {
            navigate("/login");
        }

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
            {!isLoggedIn && (
                <div>
                    <button
                        className="usa-button fa-solid fa-arrow-right-to-bracket margin-1"
                        onClick={() => {
                            const stateKey = localStorage.getItem("ops-state-key");
                            if (stateKey) {
                                window.location.href = getAuthorizationCode("logingov", stateKey).toString();
                            }
                        }}
                    >
                        <span className="margin-1">Sign-in</span>
                        <FontAwesomeIcon icon={faArrowRightToBracket} />
                    </button>
                </div>
            )}
            {isLoggedIn && (
                <div>
                    <div className="display-flex flex-align-center">
                        <div className="padding-right-1">
                            <User user={activeUser} />
                        </div>
                        <div className="padding-right-205">
                            <NotificationCenter user={activeUser} />
                        </div>
                        <button
                            className="usa-button fa-solid fa-arrow-right-to-bracket margin-1"
                            onClick={logoutHandler}
                        >
                            <span className="margin-1">Sign-out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthSection;
