import { login, logout, setUserDetails } from "./authSlice";
import { useDispatch, useSelector } from "react-redux";
import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import cryptoRandomString from "crypto-random-string";
import { getAuthorizationCode } from "./auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { solid } from "@fortawesome/fontawesome-svg-core/import.macro";
import { User } from "../UI/Header/User";
import jwt_decode from "jwt-decode";
import { getUserByOidc } from "../../api/getUser";
import { apiLogin } from "../../api/apiLogin";

async function setActiveUser(token, dispatch) {
    const decodedJwt = jwt_decode(token);
    const userId = decodedJwt["sub"];
    const userDetails = await getUserByOidc(userId);
    console.log(`Logged In User: ${userDetails}`);
    dispatch(setUserDetails(userDetails));
}

const AuthSection = () => {
    const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const callBackend = useCallback(
        async (authCode) => {
            const response = await apiLogin(authCode);

            localStorage.setItem("access_token", response.access_token);
            dispatch(login());

            await setActiveUser(response.access_token, dispatch);

            navigate("/");
        },
        [dispatch, navigate]
    );

    useEffect(() => {
        const currentJWT = localStorage.getItem("access_token");

        if (currentJWT) {
            // TODO: we should validate the JWT here and set it on state if valid else logout
            dispatch(login());
            setActiveUser(currentJWT, dispatch);
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
        dispatch(logout());
        localStorage.removeItem("access_token");
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
                    <User />
                    <button className="usa-button fa-solid fa-arrow-right-to-bracket margin-1" onClick={logoutHandler}>
                        <span className="margin-1">Sign-out</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default AuthSection;
