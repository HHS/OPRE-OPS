import React from "react";
import { useState } from "react";
import { login, logout } from "./authSlice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import cryptoRandomString from "crypto-random-string";
import { getAccessToken, getAuthorizationCode } from "./auth";
import { apiLogin } from "../../api/apiLogin";
import ContainerModal from "../UI/Modals/ContainerModal";
import { setActiveUser } from "./auth";

const MultiAuthSection = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);

    const callBackend = React.useCallback(
        async (authCode) => {
            console.log(`Received Authentication Code = ${authCode}`);
            const activeProvider = localStorage.getItem("activeProvider");
            if (activeProvider === null || activeProvider === undefined) {
                console.error("API Login Failed! No Active Provider");
                navigate("/login");
            }

            let response;
            try {
                response = await apiLogin(activeProvider, authCode);
                // eslint-disable-next-line no-unused-vars
            } catch (error) {
                console.error("Error logging in");
                dispatch(logout());
                navigate("/login");
            }

            const access_token = response.access_token;
            const refresh_token = response.refresh_token;

            if (access_token === null || access_token === undefined) {
                console.error("API Login Failed!");
                navigate("/login");
            } else {
                // TODO: We should try to move the access_token to a secure cookie,
                // which will require a bit of re-work, since we won't have access to
                // the data within the cookie; instead will need to do additional API calls
                // to get the data we need.
                localStorage.setItem("access_token", access_token);
                localStorage.setItem("refresh_token", refresh_token);
                await dispatch(login());
                await setActiveUser(access_token, dispatch);
                navigate("/");
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

        navigate("/");
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
                                    onClick={() => handleFakeAuthLogin("admin_user")}
                                >
                                    Admin User
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
                                    Basic User
                                </button>
                            </p>
                            <p>
                                <button
                                    className="usa-button  usa-button--outline width-full"
                                    onClick={() => handleFakeAuthLogin("new_user")}
                                    disabled={true}
                                >
                                    New User
                                </button>
                            </p>
                        </div>
                    </ContainerModal>
                )}
            </div>
        </>
    );
};

export default MultiAuthSection;
