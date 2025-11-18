import { Link } from "react-router-dom";
import MultiAuthSection from "../components/Auth/MultiAuthSection";
import Footer from "../components/UI/Footer";
import logo from "../images/opre-logo.svg";
import SimpleAlert from "../components/UI/Alert/SimpleAlert.jsx";
import { setLoginError } from "../components/Auth/authSlice";
import { useDispatch, useSelector } from "react-redux";
import authConstants from "../components/Auth/Auth.constants.js";

function Login() {
    const dispatch = useDispatch();
    const loginError = useSelector((state) => state.auth?.loginError);

    const styles = {
        logo: {
            maxWidth: "55%"
        },
        textLogo: {
            color: "#336A90",
            display: "flex",
            alignItems: "flex-end",
            gap: "25px"
        },
        alertContainer: {
            position: "absolute",
            zIndex: 100,
            left: "0",
            right: "0",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            overflow: "visible"
        }
    };

    return (
        <>
            <div className="bg-base-lightest">
                <div className="usa-overlay"></div>
                <header className="usa-header usa-header--extended bg-brand-primary">
                    <div className="usa-navbar padding-top-105 bg-white">
                        <div
                            className="usa-logo"
                            style={styles.logo}
                            id="logo"
                        >
                            <Link
                                to="/"
                                style={styles.textLogo}
                                title="Portfolio Management System"
                            >
                                <img
                                    src={logo}
                                    alt="OPRE Logo"
                                />
                                <span className="font-sans-sm text-bold">&nbsp;Portfolio Management System</span>
                            </Link>
                        </div>
                    </div>
                </header>

                <div style={styles.alertContainer}>
                    <div
                        className="grid-container"
                        style={{ width: "100%" }}
                    >
                        <SimpleAlert
                            type="error"
                            heading="Sign-In Failed"
                            isClosable={true}
                            isAlertVisible={loginError.hasError}
                            setIsAlertVisible={() => {
                                dispatch(setLoginError({ hasError: false, loginErrorType: null }));
                            }}
                            message={
                                authConstants.loginErrorMessages[loginError?.loginErrorType] ||
                                authConstants.loginErrorMessages.UNKNOWN_ERROR
                            }
                        />
                    </div>
                </div>

                <main id="main-content">
                    <div className="bg-base-lightest">
                        <section className="grid-container usa-section">
                            <div className="grid-row margin-x-neg-205 margin-bottom-6 flex-justify-center">
                                <div className="grid-col-6 padding-x-205 margin-bottom-4">
                                    <MultiAuthSection />
                                </div>
                                <div className="grid-col-6 padding-x-205">
                                    <h2>Access to OPS requires proper authentication.</h2>
                                    <div className="border-top border-base-lighter margin-top-3 padding-top-1">
                                        <h2>Are you a federal employee?</h2>
                                        <div className="usa-prose">
                                            <p>
                                                If you are a federal employee or contractor with an HHS email, please
                                                use HHS AMS login.
                                            </p>
                                            {!import.meta.env.PROD && (
                                                <p>
                                                    If you are part of the development team, or want to access the
                                                    system in a lower environment for testing purposes only, please use
                                                    the FakeAuth® login.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="font-12px line-height-body-2">
                                <p className="line-height-body-2">
                                    This warning banner provides privacy and security notices consistent with applicable
                                    federal laws, directives, and other federal guidance for accessing this Government
                                    system, which includes (1) this computer network, (2) all computers connected to
                                    this network, and (3) all devices and storage media attached to this network or to a
                                    computer on this network.
                                </p>
                                <p className="line-height-body-2">
                                    This system is provided for Government-authorized use only.
                                </p>
                                <p className="line-height-body-2">
                                    Unauthorized or improper use of this system is prohibited and may result in
                                    disciplinary action and/or civil and criminal penalties.
                                </p>
                                <p className="line-height-body-2">
                                    Personal use of social media and networking sites on this system is limited as to
                                    not interfere with official work duties and is subject to monitoring.
                                </p>
                                <p className="line-height-body-2">
                                    By using this system, you understand and consent to the following:
                                </p>
                                <ul>
                                    <li>
                                        The Government may monitor, record, and audit your system usage, including usage
                                        of personal devices and email systems for official duties or to conduct HHS
                                        business. Therefore, you have no reasonable expectation of privacy regarding any
                                        communication or data transiting or stored on this system. At any time, and for
                                        any lawful Government purpose, the government may monitor, intercept, and search
                                        and seize any communication or data transiting or stored on this system.
                                    </li>
                                    <li>
                                        Any communication or data transiting or stored on this system may be disclosed
                                        or used for any lawful Government purpose.
                                    </li>
                                </ul>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
            <Footer />
        </>
    );
}

export default Login;
