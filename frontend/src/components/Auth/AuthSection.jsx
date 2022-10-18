import { login, logout } from "./authSlice";
import { useDispatch, useSelector } from "react-redux";
import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ApplicationContext from "../../applicationContext/ApplicationContext";
import cryptoRandomString from "crypto-random-string";
import { getAuthorizationCode } from "./auth";
// eslint-disable-next-line import/no-unresolved
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// eslint-disable-next-line import/no-unresolved
import { solid } from "@fortawesome/fontawesome-svg-core/import.macro";
import axiosInstance from "../../axios";

const AuthSection = () => {
    const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const callBackend = useCallback(
        async (authCode) => {
            const response = await ApplicationContext.get().helpers().callBackend(`/ops/auth/authenticate`, "post", {
                callbackUrl: window.location.href,
                code: authCode,
            });

            localStorage.setItem("access_token", response.data.access);
            localStorage.setItem("refresh_token", response.data.refresh);
            console.log(`Access Token: ${response.data.access}`);

            dispatch(login());

            navigate("/");
        },
        [dispatch, navigate]
    );

    useEffect(() => {
        const currentJWT = localStorage.getItem("access_token");

        if (currentJWT) {
            // TODO: we should validate the JWT here and set it on state if valid else logout
            dispatch(login());
            return;
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
    }, [callBackend, dispatch]);

    const logoutHandler = () => {
        const response = axiosInstance.post("api/logout/blacklist/", {
            refresh_token: localStorage.getItem("refresh_token"),
        });
        console.log(response.json);
        dispatch(logout());
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        axiosInstance.defaults.headers["Authorization"] = null;
        navigate("/");
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
                        <FontAwesomeIcon icon={solid("arrow-right-to-bracket")} />
                    </button>
                </div>
            )}
            {isLoggedIn && (
                <div>
                    <button className="usa-button fa-solid fa-arrow-right-to-bracket margin-1" onClick={logoutHandler}>
                        <span className="margin-1">Sign-out</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default AuthSection;
