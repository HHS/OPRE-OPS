import cryptoRandomString from "crypto-random-string";
import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { useLoginMutation } from "../../api/opsAuthAPI";
import ContainerModal from "../UI/Modals/ContainerModal";
import { getAuthorizationCode, setActiveUser } from "./auth";
import { login, logout } from "./authSlice";
import PacmanLoader from "react-spinners/PacmanLoader";

/**
 * Component that handles multiple authentication methods
 * @returns {React.ReactElement} The MultiAuthSection component
 */
const MultiAuthSection = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [showModal, setShowModal] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    // Get the RTK Query login mutation hook
    const [loginMutation] = useLoginMutation();

    /**
     * Handles the authentication code callback from the provider
     * @param {string} authCode - The authorization code from the provider
     */
    const callBackend = useCallback(
        async (authCode) => {
            setIsAuthenticating(true);
            try {
                console.log(`Received Authentication Code = ${authCode}`);
                const activeProvider = localStorage.getItem("activeProvider");
                if (!activeProvider) {
                    console.error("API Login Failed! No Active Provider");
                    navigate("/login");
                    return;
                }

                // Use the RTK Query mutation instead of direct API call
                const response = await loginMutation({
                    provider: activeProvider,
                    code: authCode
                }).unwrap();

                const { access_token, refresh_token } = response;

                if (!access_token) {
                    console.error("API Login Failed!");
                    dispatch(logout());
                    navigate("/login");
                    return;
                }

                // Store tokens in localStorage
                localStorage.setItem("access_token", access_token);
                localStorage.setItem("refresh_token", refresh_token);

                // Update Redux state
                await dispatch(login());
                await setActiveUser(access_token, dispatch);

                // Navigate to the intended destination or home
                const from = location.state?.from?.pathname || "/";
                navigate(from, { replace: true });
            } catch (error) {
                console.error("Error logging in:", error);
                dispatch(logout());
                setShowModal(false);
                navigate("/login");
            } finally {
                setIsAuthenticating(false);
            }
        },
        [dispatch, navigate, loginMutation, location]
    );

    useEffect(() => {
        // Check for authentication code in URL first - this should take priority
        const queryParams = new URLSearchParams(window.location.search);
        const localStateString = localStorage.getItem("ops-state-key");

        // Process auth callback before doing any other auth checks
        if (queryParams.has("state") && queryParams.has("code") && localStateString) {
            const returnedState = queryParams.get("state");
            const authCode = queryParams.get("code");

            console.log(`Processing auth callback with code: ${authCode}`);
            localStorage.removeItem("ops-state-key");

            if (localStateString !== returnedState) {
                console.error("State mismatch:", { localStateString, returnedState });
                throw new Error("Response from OIDC provider is invalid.");
            } else if (authCode) {
                // Handle the code immediately, no need to check tokens first
                callBackend(authCode).catch((error) => {
                    console.error("Error in callBackend:", error);
                    dispatch(logout());
                    navigate("/login");
                });

                // Exit early - don't run the ensureActiveUser logic during auth callback
                return;
            }
        }

        // Set state token if none exists
        if (!localStateString && !queryParams.has("code")) {
            localStorage.setItem("ops-state-key", cryptoRandomString({ length: 64 }));
        }
    }, [callBackend, dispatch, navigate]);

    /**
     * Handles login with fake authentication (for development/testing)
     * @param {string} userType - The type of user to authenticate as
     */
    const handleFakeAuthLogin = async (userType) => {
        setIsAuthenticating(true);
        try {
            localStorage.setItem("activeProvider", "fakeauth");
            await callBackend(userType);
        } catch (error) {
            console.error(error);
            setIsAuthenticating(false);
        }
    };

    /**
     * Handles login with SSO provider
     * @param {string} provider - The SSO provider to use
     */
    const handleSSOLogin = (provider) => {
        setIsAuthenticating(true);
        localStorage.setItem("activeProvider", provider);
        const stateKey = localStorage.getItem("ops-state-key");
        if (stateKey) {
            const authUrl = getAuthorizationCode(provider, stateKey);
            window.location.href = authUrl.toString();
        } else {
            console.error("No state key found for SSO login");
            setIsAuthenticating(false);
        }
    };

    if (isAuthenticating) {
        return (
            <div className="bg-white padding-y-3 padding-x-5 border border-base-lighter">
                <h1>Signing In...</h1>
                <PacmanLoader
                    size={25}
                    aria-label="Loading Spinner"
                    data-testid="loader"
                />
            </div>
        );
    }

    return (
        <>
            <div className="bg-white padding-y-3 padding-x-5 border border-base-lighter">
                <h1 className="margin-bottom-1">Sign in to your account</h1>
                <div className="usa-prose">
                    <p className="margin-top-1">
                        You can access your account by signing in with one of the options below.
                    </p>
                </div>
                {import.meta.env.MODE === "development" && (
                    <p>
                        <button
                            className="usa-button usa-button--outline width-full"
                            onClick={() => handleSSOLogin("logingov")}
                            disabled={isAuthenticating}
                        >
                            {isAuthenticating ? "Signing in..." : "Sign in with Login.gov"}
                        </button>
                    </p>
                )}
                <p>
                    <button
                        className="usa-button usa-button--outline width-full"
                        onClick={() => handleSSOLogin("hhsams")}
                        disabled={isAuthenticating}
                    >
                        {isAuthenticating ? "Signing in..." : "Sign in with HHS AMS"}
                    </button>
                </p>
                {!import.meta.env.PROD && (
                    <p>
                        <button
                            className="usa-button usa-button--outline width-full"
                            onClick={() => setShowModal(true)}
                            disabled={isAuthenticating}
                        >
                            {isAuthenticating ? "Signing in..." : "Sign in with FakeAuth®"}
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
                                    className="usa-button usa-button--outline width-full"
                                    onClick={() => handleFakeAuthLogin("system_owner")}
                                    disabled={isAuthenticating}
                                >
                                    System Owner
                                </button>
                            </p>
                            <p>
                                <button
                                    className="usa-button usa-button--outline width-full"
                                    onClick={() => handleFakeAuthLogin("budget_team")}
                                    disabled={isAuthenticating}
                                >
                                    Budget Team Member
                                </button>
                            </p>
                            <p>
                                <button
                                    className="usa-button usa-button--outline width-full"
                                    onClick={() => handleFakeAuthLogin("procurement_team")}
                                    disabled={isAuthenticating}
                                >
                                    Procurement Team Member
                                </button>
                            </p>
                            <p>
                                <button
                                    className="usa-button usa-button--outline width-full"
                                    onClick={() => handleFakeAuthLogin("division_director")}
                                    disabled={isAuthenticating}
                                >
                                    Division Director
                                </button>
                            </p>
                            <p>
                                <button
                                    className="usa-button usa-button--outline width-full"
                                    onClick={() => handleFakeAuthLogin("basic_user")}
                                    disabled={isAuthenticating}
                                >
                                    User Demo
                                </button>
                            </p>
                            <p>
                                <button
                                    className="usa-button usa-button--outline width-full"
                                    onClick={() => handleFakeAuthLogin("power_user")}
                                    disabled={isAuthenticating}
                                >
                                    Power User
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
