import { nanoid } from "nanoid";
import { setAuthStateToken, setAuthenticationCode, login, logout, setUserDetails } from "./authSlice";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = (props) => {
    const stateString = nanoid(64);
    const authStateToken = useSelector((state) => state.auth.authStateToken);
    const authCode = useSelector((state) => state.auth.authCode);
    const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        const localStateString = localStorage.getItem("ops-state-key");
        console.log({ localStateString });

        if (localStateString) {
            dispatch(setAuthStateToken(localStateString));

            const queryParams = new URLSearchParams(window.location.search);

            // check if we have been redirected here from the OIDC provider
            if (queryParams.has("state")) {
                // check that the state matches
                const returnedState = queryParams.get("state");
                const localStateString = localStorage.getItem("ops-state-key");

                localStorage.removeItem("ops-state-key");

                if (localStateString !== returnedState) {
                    throw new Error("Response from OIDC provider is invalid.");
                } else {
                    console.log("Received Authentication Code");
                    const returnedAuthCode = queryParams.get("code");
                    dispatch(setAuthenticationCode(returnedAuthCode));
                    navigate("/login");
                }
            }
        } else {
            localStorage.setItem("ops-state-key", stateString);
            dispatch(setAuthStateToken(stateString));
        }
    }, [authStateToken]);

    useEffect(() => {
        // login in backend here synchronously
        // timer to simulate waiting for response from backend
        console.log({ authCode: authCode });
        if (authCode) {
            // pop the state key from local storage and save to state
            const localStateString = localStorage.getItem("ops-state-key");
            dispatch(setAuthStateToken(localStateString));
            localStorage.removeItem("ops-state-key");

            setTimeout(() => {
                const responseFromBackend = {
                    httpStatusCode: 200,
                    state: authStateToken,
                    userDetails: {
                        userId: 101,
                        fullName: "Matthew M. Anderson",
                        email: "matthew.m.anderson@example.com",
                    },
                };

                if (responseFromBackend.httpStatusCode === 200 && responseFromBackend.state === authStateToken) {
                    dispatch(setUserDetails(responseFromBackend.userDetails));
                    dispatch(login());
                } else {
                    // throw an error? retry?
                    console.log("Login failed in backend.");
                }
            }, 1000);
        }
    }, [authCode]);

    const getAuthorizationCode = () => {
        console.log({ authStateToken });
        console.log({ isLoggedIn });
        const providerUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        providerUrl.searchParams.set(
            "client_id",
            "38228443168-37a1iaj6aisn53cbh4kdemko513aigo1.apps.googleusercontent.com"
        );
        providerUrl.searchParams.set("response_type", "code");
        providerUrl.searchParams.set("scope", "openid");
        providerUrl.searchParams.set("redirect_uri", "http://localhost:3001/login");
        providerUrl.searchParams.set("state", authStateToken);
        providerUrl.searchParams.set("nonce", authStateToken);
        console.log({ providerUrl: providerUrl.toString() });
        window.location.href = providerUrl;
        // setRequestSent(true);
    };

    const logoutHandler = () => {
        dispatch(logout());
        localStorage.removeItem("ops-state-key");
        dispatch(setAuthStateToken(stateString));
    };

    return (
        <main>
            <p>State is: {authStateToken}</p>
            {authCode && <p>Authentication Code is: {authCode}</p>}
            {isLoggedIn && <p>User is logged in.</p>}
            {!isLoggedIn && <p>User is not logged in.</p>}
            <div>
                <button onClick={getAuthorizationCode}>Login to Google</button>
            </div>
            {isLoggedIn && (
                <div>
                    <button onClick={logoutHandler}>Logout</button>
                </div>
            )}
        </main>
    );
};

export default Login;
