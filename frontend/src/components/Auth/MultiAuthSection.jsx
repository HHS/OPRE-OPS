import React from "react";
import { login, setUserDetails } from "./authSlice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import cryptoRandomString from "crypto-random-string";
import { getAuthorizationCode } from "./auth";
import jwt_decode from "jwt-decode";
import { apiLogin } from "../../api/apiLogin";
import ContainerModal from "../UI/Modals/ContainerModal";
import { useGetUserByOIDCIdQuery } from "../../api/opsAPI";

async function setActiveUser(token, dispatch) {
    // TODO: Vefiry the Token!
    //const isValidToken = validateToken(token);
    const decodedJwt = jwt_decode(token);

    const userId = decodedJwt["sub"];
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data: user } = useGetUserByOIDCIdQuery(userId);

    dispatch(setUserDetails(user));
}

const MultiAuthSection = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [showModal, setShowModal] = React.useState(false);
    const callBackend = React.useCallback(
        async (authCode) => {
            console.log(`Received Authentication Code = ${authCode}`);

            const response = await apiLogin(authCode);
            console.debug(`API Login Response = ${response}`);

            localStorage.setItem("access_token", response.access_token);
            dispatch(login());
            if (response.is_new_user) {
                navigate("/user/edit");
                return;
            }

            await setActiveUser(response.access_token, dispatch);

            navigate("/");
        },
        [dispatch, navigate]
    );

    React.useEffect(() => {
        const currentJWT = localStorage.getItem("access_token");
        if (currentJWT) {
            // TODO: we should validate the JWT here and set it on state if valid else logout
            dispatch(login());
            setActiveUser(currentJWT, dispatch);
            return;
        }

        const localStateString = localStorage.getItem("ops-state-key");
        console.debug(`localStateString = ${localStateString}`);

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

    // TODO: Replace these tokens with config variables, that can be passed in at deploy-time,
    //       So that we don't actually store anything in code.
    const handleFakeAuthLogin = (user_type) => {
        console.log("FakeAuth Login--!!");
        const fakeUsers = {
            admin: {
                access_token:
                    "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTY4OTcwMDQxOSwianRpIjoiYmE3ZmZhNmMtOWZiNy00NzQxLTkzMTYtZTVlZThiOGVhMzkxIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6IjAwMDAwMDAwLTAwMDAtMTExMS1hMTExLTAwMDAwMDAwMDAxOCIsIm5iZiI6MTY4OTcwMDQxOSwiZXhwIjoxOTg5NzM2NDE5fQ.qazM0iIZW-cDnNlIeC2dB5CE9P_-49T48TcKhdaj0jX4EMo-t01GMvWW0JIMmvsE4kj_yC3I2_r-HEwLL85z0jSiKEO7C_Nzgj4XgXvA_awlAA8e0Bny4pRol_wHKGEZIzIttZUaYgm8QewUC4uS1-vW92mvEH6dgDpChSlrI8Ao5352ydIeYBMQcOXDIIPRtupYjBBTTfafv87gsNDUoo4GUO53tFM_VApQl3UFxEzqkYKY9hc_TjiZMVK9OyF7uSA_4ICaF1hHnZvB6sQHTW3GcrUGvhwJ76JYnJTCPUcAmNkGlPSuwidq9ybl5sCYp1LWMigQJ50pQL2HngUMcA",
            },
            basic_user: {
                access_token:
                    "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTY4OTcwMDQxOSwianRpIjoiYmE3ZmZhNmMtOWZiNy00NzQxLTkzMTYtZTVlZThiOGVhMzkxIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6IjAwMDAwMDAwLTAwMDAtMTExMS1hMTExLTAwMDAwMDAwMDAxOSIsIm5iZiI6MTY4OTcwMDQxOSwiZXhwIjoxOTg5NzM2NDE5fQ.Vj8vjnSSiay_XbZH3xyt0qpMUh3YEso0pfER2bAt08Lara1rsji9WdIzPljSfZMiOl0c565Rrw0oKiXFeyjZNFKpubZ8IVN-POiu9j1X8-Iw7cxIwg8gMElraSEHTz23JRSNWKmAOtre9s0wMiCfYk7kStFwvEYErQfpZjVYpTmVkgK4I4s1P4S8Z_h5BuMFGs-92_z50bIY9-ANHlNNGs0r9dut6Ta64HxOiP3mhJQFeZBazhBrXaw-5QesN9Tvo5pftvIpW2xYg3umicB5Y2LXV1uQKFC3WZ_hZekYbBoJoIiXwPJIT9LvTVhM_nAwgd16XKXNwfkQnpESwPTmcQ",
            },
            new_user: {
                access_token:
                    "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTY4OTcwMDQxOSwianRpIjoiYmE3ZmZhNmMtOWZiNy00NzQxLTkzMTYtZTVlZThiOGVhMzkxIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6IjAwMDAwMDAwLTAwMDAtMTExMS1hMTExLTk5OTAwMDAwMDAwMCIsIm5iZiI6MTY4OTcwMDQxOSwiZXhwIjoxOTg5NzM2NDE5fQ.c_vTIVsZgjazU4TDKXjru7OymUjPuqy6Wkbq-sS2at791zXcAAX9ykfGkL17GpbaUqng8dZT_ja_aLwcFN7-53kEk4MSEITN0qISQwsEnDDdq522HxzJ5v2quIylZbw-HkzIIBLwQw6qEnhlBUeqof2TyHmevCgGwcrZaUMhz8CaBFJn26r5nppfbGCIQOwT5D_jeH33DSQPjUJg4h6kfP2gtb7zyLUMbn0HmIwdK8A6FstBI6wo3QIx-rvpxx9brVF140D73YVYeextvrjTUoNdJZ1TQSoExWoPCCTHHwNA0bvZ552jhRVmXCxR6X7-JBNccWiKOiroWffIdG8L8Q",
                is_new_user: true, // Indicates this is a new user, so prompt for registration
            },
        };

        //console.log(`API Login Response = ${JSON.stringify(fakeUsers[user].access_token)}`);
        localStorage.setItem("access_token", fakeUsers[user_type].access_token);
        //console.log(`localStorage.getItem("access_token") = ${localStorage.getItem("access_token")}`);
        dispatch(login());
        setActiveUser(fakeUsers[user_type].access_token, dispatch);
        navigate("/");
        console.log("FakeUser Logged In!");
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
                <p>
                    <button
                        className="usa-button usa-button--outline width-full"
                        onClick={() =>
                            (window.location.href = getAuthorizationCode(
                                "logingov",
                                localStorage.getItem("ops-state-key")
                            ))
                        }
                    >
                        Sign in with Login.gov
                    </button>
                </p>
                <p>
                    <button
                        className="usa-button usa-button--outline width-full"
                        onClick={() =>
                            (window.location.href = getAuthorizationCode(
                                "hhsams",
                                localStorage.getItem("ops-state-key")
                            ))
                        }
                    >
                        Sign in with HHS AMS
                    </button>
                </p>
                <p>
                    <button className="usa-button usa-button--outline width-full" onClick={() => setShowModal(true)}>
                        Sign in with FakeAuth®
                    </button>
                </p>
                <div className="border-top border-base-lighter margin-top-6 padding-top-1">
                    <p>
                        <strong>Don&apos;t have an account?</strong>
                    </p>
                    <p>If you don&apos;t have an account already, sign up here:</p>
                    <p>
                        <a
                            href="https://www.login.gov/help/get-started/create-your-account/"
                            className="usa-button width-full"
                        >
                            Create Login.gov account
                        </a>
                    </p>
                </div>
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
                                    onClick={() => handleFakeAuthLogin("admin")}
                                >
                                    Admin User
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
                                    New User (Registration)
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
