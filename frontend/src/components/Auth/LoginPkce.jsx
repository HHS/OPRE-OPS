import { nanoid } from "nanoid";
import {
    login,
    logout,
    setAuthenticationCode,
    setAuthStateToken,
    setCodeChallenge,
    setCodeVerifier,
    setCodeVerifierBase64URLEncode,
    setUserDetails,
} from "./authSlice";
import { useDispatch, useSelector } from "react-redux";
import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sha256 } from "js-sha256";
import ApplicationContext from "../../applicationContext/ApplicationContext";

const Login = (props) => {
    const base64_urlencode = (str) => {
        return btoa(String.fromCharCode.apply(null, new TextEncoder().encode(str)))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
    };

    const base64URLEncode = (str) => {
        return str.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    };

    const stateString = nanoid(64);

    const codeVerifier = useSelector((state) => state.auth.codeVerifier);
    const codeChallenge = useSelector((state) => state.auth.codeChallenge);
    const codeVerifierBase64URLEncode = useSelector((state) => state.auth.codeVerifierBase64URLEncode);

    const authStateToken = useSelector((state) => state.auth.authStateToken);
    const authCode = useSelector((state) => state.auth.authCode);
    const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const callBackend = useCallback(async () => {
        const response = await ApplicationContext.get().helpers().callBackend(`/ops/auth/oidc`, "post", {
            callbackUrl: window.location.href,
            pkceCodeVerifier: codeVerifier,
            code: authCode,
            code_challenge: codeChallenge,
        });

        console.log({ response });

        navigate("/login-pkce");
    }, []);

    useEffect(() => {
        console.log("useEffect running.");
        // const tmpCodeVerifier = nanoid(128);
        // const tmpCodeVerifier = base64_urlencode("5787d673fb784c90f0e309883241803d");
        const tmpCodeVerifier = base64_urlencode(nanoid(128));
        // const tmp1 = base64_urlencode(tmpCodeVerifier);
        // console.log({ tmp1 });
        console.log("sanity check.");
        console.log({ tmpCodeVerifier });
        const tmpCodeChallenge = sha256(tmpCodeVerifier);
        // const tmpCodeVerifierBase64URLEncode = base64_urlencode(tmpCodeChallenge);
        const tmpCodeVerifierBase64URLEncode = base64_urlencode(tmpCodeChallenge);
        console.log({ tmpCodeVerifierBase64URLEncode });
        dispatch(setCodeVerifier(tmpCodeVerifier));
        dispatch(setCodeChallenge(tmpCodeChallenge));
        dispatch(setCodeVerifierBase64URLEncode(tmpCodeVerifierBase64URLEncode));
    }, []);

    useEffect(() => {
        const localStateString = localStorage.getItem("ops-state-key");
        console.log({ localStateString });

        if (localStateString) {
            dispatch(setAuthStateToken(localStateString));

            const queryParams = new URLSearchParams(window.location.search);
            const queryParamsString = queryParams.toString();
            console.log({ queryParamsString });

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

                    // callBackend().catch(console.error);
                }
            }
        } else {
            localStorage.setItem("ops-state-key", stateString);
            dispatch(setAuthStateToken(stateString));
        }
    }, [authStateToken, callBackend]);

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
        const providerUrl = new URL("https://idp.int.identitysandbox.gov/openid_connect/authorize");
        providerUrl.searchParams.set("acr_values", "http://idmanagement.gov/ns/assurance/ial/1");
        providerUrl.searchParams.set("client_id", "urn:gov:gsa:openidconnect.profiles:sp:sso:hhs_acf:opre_ops");
        providerUrl.searchParams.set("response_type", "code");
        providerUrl.searchParams.set("scope", "openid");
        providerUrl.searchParams.set("redirect_uri", "http://localhost:3001/login-pkce");
        providerUrl.searchParams.set("state", authStateToken);
        providerUrl.searchParams.set("nonce", authStateToken);
        providerUrl.searchParams.set("code_challenge", codeVerifierBase64URLEncode);
        providerUrl.searchParams.set("code_challenge_method", "S256");
        console.log(`authStateToken = ${authStateToken}`);
        console.log(`providerUrl.searchParams = ${providerUrl.searchParams}`);
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
                <button onClick={getAuthorizationCode}>Login to Login.gov</button>
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
