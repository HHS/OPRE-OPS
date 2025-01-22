import { login, logout } from "./authSlice";
import { useDispatch, useSelector } from "react-redux";
import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import cryptoRandomString from "crypto-random-string";
import { getAccessToken, getAuthorizationCode } from "./auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightToBracket } from "@fortawesome/free-solid-svg-icons";
import User from "../UI/Header/User";
import { apiLogin, apiLogout } from "../../api/apiLogin";
import NotificationCenter from "../UI/NotificationCenter/NotificationCenter";
import { setActiveUser } from "./auth";

const AuthSection = () => {
    const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
    const activeUser = useSelector((state) => state.auth.activeUser);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const callBackend = useCallback(
        async (authCode) => {
            try {
                const response = await apiLogin(authCode);
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
        [activeUser, dispatch, navigate]
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
                    callBackend(authCode).catch(console.error);
                }
            }
        } else {
            // first page load - generate state token and set on localStorage
            localStorage.setItem("ops-state-key", cryptoRandomString({ length: 64 }));
        }
    }, [activeUser, callBackend, dispatch, navigate]);

    const logoutHandler = async () => {
        await apiLogout();
        await dispatch(logout());
        navigate("/login");
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
                        onClick={() =>
                            (window.location.href = getAuthorizationCode(localStorage.getItem("ops-state-key")))
                        }
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
