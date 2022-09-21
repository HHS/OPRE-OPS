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
import cryptoRandomString from "crypto-random-string";

const LoginPkce = (props) => {
    const base64_urlencode = (str) => {
        return btoa(String.fromCharCode.apply(null, new Uint8Array(str)))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
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

    console.log({ codeVerifier });
    console.log({ codeChallenge });
    console.log({ codeVerifierBase64URLEncode });

    const tmpCodeVerifier = "5787d673fb784c90f0e309883241803d";
    // const tmpCodeVerifier = cryptoRandomString({ length: 32 });

    // create code challenge
    const tmpCodeChallenge = sha256.create();
    tmpCodeChallenge.update(tmpCodeVerifier);
    const tmpCodeChallengeHex = tmpCodeChallenge.hex();
    const tmpCodeChallengeDigest = tmpCodeChallenge.digest();

    // create base64 url encoded code challenge
    const tmpCodeVerifierBase64URLEncode = base64_urlencode(tmpCodeChallengeDigest);

    useEffect(() => {
        // set state
        dispatch(setCodeVerifier(tmpCodeVerifier));
        dispatch(setCodeChallenge(tmpCodeChallengeHex));
        dispatch(setCodeVerifierBase64URLEncode(tmpCodeVerifierBase64URLEncode));
    }, []);

    const callBackend = useCallback(async (innerCodeVerifier, innerAuthCode) => {
        const response = await ApplicationContext.get().helpers().callBackend(`/ops/auth/oidc`, "post", {
            callbackUrl: window.location.href,
            pkceCodeVerifier: innerCodeVerifier,
            code: innerAuthCode,
        });

        console.log({ response });

        navigate("/login-pkce");
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
            if (queryParams.has("state") && queryParams.has("code")) {
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
                }
            }
        } else {
            localStorage.setItem("ops-state-key", stateString);
            dispatch(setAuthStateToken(stateString));
        }
    }, []);

    useEffect(() => {
        console.log({ authCode: authCode });

        if (authCode) {
            callBackend(codeVerifier, authCode).catch(console.error);
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

export default LoginPkce;
