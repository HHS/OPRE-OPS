import { nanoid } from "nanoid";
import {
    login,
    logout,
    setAuthenticationCode,
    setAuthStateToken,
    setCodeChallenge,
    setCodeVerifier,
    setCodeVerifierBase64URLEncode,
} from "./authSlice";
import { useDispatch, useSelector } from "react-redux";
import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { sha256 } from "js-sha256";
import ApplicationContext from "../../applicationContext/ApplicationContext";
import cryptoRandomString from "crypto-random-string";
import { getAuthorizationCode } from "./auth";

const LoginJwt = () => {
    const base64_urlencode = (str) => {
        return btoa(String.fromCharCode.apply(null, new Uint8Array(str)))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
    };

    const stateString = nanoid(64);

    const codeVerifier = useSelector((state) => state.auth.codeVerifier);

    const authStateToken = useSelector((state) => state.auth.authStateToken);
    const authCode = useSelector((state) => state.auth.authCode);
    const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const tokenLock = useRef(false);

    const generateTokens = () => {
        const tmpCodeVerifier = cryptoRandomString({ length: 32 });

        // create code challenge
        const tmpCodeChallenge = sha256.create();
        tmpCodeChallenge.update(tmpCodeVerifier);
        const tmpCodeChallengeHex = tmpCodeChallenge.hex();
        const tmpCodeChallengeDigest = tmpCodeChallenge.digest();

        // create base64 url encoded code challenge
        const tmpCodeVerifierBase64URLEncode = base64_urlencode(tmpCodeChallengeDigest);

        return { tmpCodeVerifier, tmpCodeChallengeHex, tmpCodeVerifierBase64URLEncode };
    };

    useEffect(() => {
        if (tokenLock.current === false) {
            console.log("inside lock section.");
            tokenLock.current = true;
            const tmpCodeVerifier = localStorage.getItem("ops-token-codeVerifier");
            console.log({ tmpCodeVerifier });
            if (tmpCodeVerifier) {
                console.log("set state from localstorage");
                dispatch(setCodeVerifier(localStorage.getItem("ops-token-codeVerifier")));
                dispatch(setCodeChallenge(""));
                dispatch(setCodeVerifierBase64URLEncode(""));
                localStorage.removeItem("ops-token-codeVerifier");
            } else {
                console.log("set state from generated tokens");
                const { tmpCodeVerifier, tmpCodeChallengeHex, tmpCodeVerifierBase64URLEncode } = generateTokens();

                dispatch(setCodeVerifier(tmpCodeVerifier));
                dispatch(setCodeChallenge(tmpCodeChallengeHex));
                dispatch(setCodeVerifierBase64URLEncode(tmpCodeVerifierBase64URLEncode));
            }
        }
    }, []);

    const callBackend = useCallback(async (innerCodeVerifier, innerAuthCode) => {
        const response = await ApplicationContext.get().helpers().callBackend(`/ops/auth/oidc`, "post", {
            callbackUrl: window.location.href,
            pkceCodeVerifier: innerCodeVerifier,
            code: innerAuthCode,
        });

        console.log({ jwt: response.jwt });
        dispatch(login());

        navigate("/login-jwt");
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
                    localStorage.setItem("ops-token-authCode", returnedAuthCode);
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
                <button onClick={() => (window.location.href = getAuthorizationCode(authStateToken))}>
                    Login to Login.gov
                </button>
            </div>
            {isLoggedIn && (
                <div>
                    <button onClick={logoutHandler}>Logout</button>
                </div>
            )}
        </main>
    );
};

export default LoginJwt;
