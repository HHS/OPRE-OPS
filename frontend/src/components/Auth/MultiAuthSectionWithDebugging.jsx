import React, { useState } from "react";
import { login } from "./authSlice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import cryptoRandomString from "crypto-random-string";
import { getAccessToken, getAuthorizationCode, setActiveUser } from "./auth";
import { apiLogin } from "../../api/apiLogin";
import ContainerModal from "../UI/Modals/ContainerModal";

const MultiAuthSectionWithDebugging = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [debugInfo, setDebugInfo] = useState([]);

    const addDebugInfo = (info) => {
        setDebugInfo((prev) => [...prev, info]);
    };

    const callBackend = React.useCallback(
        async (authCode) => {
            console.log(`Received Authentication Code = ${authCode}`);
            const activeProvider = localStorage.getItem("activeProvider");
            if (activeProvider === null || activeProvider === undefined) {
                addDebugInfo("API Login Failed! No Active Provider");
            }

            let response;
            try {
                response = await apiLogin(activeProvider, authCode);
                // eslint-disable-next-line no-unused-vars
            } catch (error) {
                addDebugInfo("Error logging in");
            }

            const access_token = response.access_token;
            const refresh_token = response.refresh_token;

            if (access_token === null || access_token === undefined) {
                addDebugInfo("API Login Failed!");
            } else {
                // TODO: We should try to move the access_token to a secure cookie,
                // which will require a bit of re-work, since we won't have access to
                // the data within the cookie; instead will need to do additional API calls
                // to get the data we need.
                addDebugInfo(`Access Token = ${access_token}`);
                addDebugInfo(`Refresh Token = ${refresh_token}`);
                localStorage.setItem("access_token", access_token);
                localStorage.setItem("refresh_token", refresh_token);
                await dispatch(login());
                await setActiveUser(access_token, dispatch);
            }
        },
        [dispatch, navigate]
    );

    React.useEffect(() => {
        const currentJWT = getAccessToken();
        if (currentJWT) {
            // TODO: we should validate the JWT here and set it on state if valid else logout
            dispatch(login());
            setActiveUser(currentJWT, dispatch);
            return;
        }

        const localStateString = localStorage.getItem("ops-state-key");
        if (localStateString) {
            const queryParams = new URLSearchParams(window.location.search);
            addDebugInfo(`Current URL = ${window.location.href}`);
            addDebugInfo(`Query Params = ${queryParams}`);

            // check if we have been redirected here from the OIDC provider
            if (queryParams.has("state") && queryParams.has("code")) {
                // check that the state matches
                const returnedState = queryParams.get("state");
                const localStateString = localStorage.getItem("ops-state-key");

                localStorage.removeItem("ops-state-key");

                if (localStateString !== returnedState) {
                    addDebugInfo("Response from OIDC provider is invalid.");
                    throw new Error("Response from OIDC provider is invalid.");
                } else {
                    const authCode = queryParams.get("code");
                    addDebugInfo(`Auth Code = ${authCode}`);
                    callBackend(authCode).catch(console.error);
                }
            }
        } else {
            // first page load - generate state token and set on localStorage
            localStorage.setItem("ops-state-key", cryptoRandomString({ length: 64 }));
        }
    }, [callBackend, dispatch]);

    // TODO: Replace these tokens with config variables, that can be passed in at deploy-time,
    //       So that we don't actually store anything in code.
    const handleFakeAuthLogin = (user_type) => {
        localStorage.setItem("activeProvider", "fakeauth");
        callBackend(user_type).catch(console.error);
    };

    const handleSSOLogin = (provider) => {
        localStorage.setItem("activeProvider", provider);
        window.location.href = getAuthorizationCode(provider, localStorage.getItem("ops-state-key"));
    };

    return (
        <>
            <div className="bg-white padding-y-3 padding-x-5 border border-base-lighter">
                <h1 className="margin-bottom-1">Sign in to your account</h1>
                <div className="usa-prose">
                    <p className="margin-top-1">
                        You can access your account by signing in with one of the options below.
                    </p>
                </div>
                {import.meta.env.MODE === "development" && ( // login.gov is only configured to work locally at the moment
                    <p>
                        <button
                            className="usa-button usa-button--outline width-full"
                            onClick={() => handleSSOLogin("logingov")}
                        >
                            Sign in with Login.gov
                        </button>
                    </p>
                )}
                <p>
                    <button
                        className="usa-button usa-button--outline width-full"
                        onClick={() => handleSSOLogin("hhsams")}
                    >
                        Sign in with HHS AMS
                    </button>
                </p>
                {!import.meta.env.PROD && (
                    <p>
                        <button
                            className="usa-button usa-button--outline width-full"
                            onClick={() => setShowModal(true)}
                        >
                            Sign in with FakeAuth®
                        </button>
                    </p>
                )}
                {showModal && (
                    <ContainerModal
                        heading="FakeAuth® User Selection"
                        description="Please select the User role you would like to assume."
                        setShowModal={setShowModal}
                    >
                        <div className="usa-prose">
                            <p>
                                <button
                                    className="usa-button  usa-button--outline width-full"
                                    onClick={() => handleFakeAuthLogin("system_owner")}
                                >
                                    System Owner
                                </button>
                            </p>
                            <p>
                                <button
                                    className="usa-button  usa-button--outline width-full"
                                    onClick={() => handleFakeAuthLogin("budget_team")}
                                >
                                    Budget Team Member
                                </button>
                            </p>
                            <p>
                                <button
                                    className="usa-button  usa-button--outline width-full"
                                    onClick={() => handleFakeAuthLogin("division_director")}
                                >
                                    Division Director
                                </button>
                            </p>
                            <p>
                                <button
                                    className="usa-button  usa-button--outline width-full"
                                    onClick={() => handleFakeAuthLogin("basic_user")}
                                >
                                    User Demo
                                </button>
                            </p>
                        </div>
                    </ContainerModal>
                )}
            </div>
            {debugInfo.length > 0 && (
                <div className="usa-prose">
                    <h2>Debug Information</h2>
                    <ul>
                        {debugInfo.map((info, index) => (
                            <li key={index}>{info}</li>
                        ))}
                    </ul>
                </div>
            )}
        </>
    );
};

export default MultiAuthSectionWithDebugging;
