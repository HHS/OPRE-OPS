import Footer from "../components/UI/Footer";
import MultiAuthSection from "../components/Auth/MultiAuthSection";
import logo from "../components/UI/Header/OPRE_Logo.png";

function Login() {
    const styles = {
        logo: {
            maxWidth: "70%"
        },
        textlogo: {
            color: "#336A90"
        }
    };

    return (
        <div className="bg-base-lightest">
            <div className="usa-overlay"></div>
            <header className="usa-header usa-header--extended bg-brand-primary">
                <div className="usa-navbar padding-top-105 bg-white">
                    <div
                        className="usa-logo"
                        style={styles.logo}
                        id="-logo"
                    >
                        <a
                            href="/"
                            style={styles.textlogo}
                            title="Portfolio Management System"
                        >
                            <img
                                src={logo}
                                alt="OPRE Logo"
                            />
                            <em className="font-ui-md">&nbsp;Portfolio Management System</em>
                        </a>
                    </div>
                </div>
            </header>

            <main id="main-content">
                <div className="bg-base-lightest">
                    <section className="grid-container usa-section">
                        <div className="grid-row margin-x-neg-205 margin-bottom-7 flex-justify-center">
                            <div className="grid-col-12 mobile-lg:grid-col-10 tablet:grid-col-8 desktop:grid-col-6 padding-x-205 margin-bottom-7">
                                <h1 className="desktop:display-none font-sans-lg margin-bottom-4 tablet:margin-top-neg-3">
                                    Access to OPS requires proper authentication.
                                </h1>
                                <MultiAuthSection />
                            </div>
                            <div className="grid-col-12 mobile-lg:grid-col-10 tablet:grid-col-8 desktop:grid-col-6 padding-x-205">
                                <h2 className="display-none desktop:display-block">
                                    Access to OPS requires proper authentication.
                                </h2>
                                <div className="border-top border-base-lighter margin-top-3 padding-top-1">
                                    <h2>Are you a federal employee?</h2>
                                    <div className="usa-prose">
                                        <p>
                                            If you are a federal employee or contractor with an HHS email, please use
                                            HHS AMS login.
                                        </p>
                                        {!import.meta.env.PROD && (
                                            <p>
                                                If you are part of the development team, or want to access the system in
                                                a lower environment for testing purposes only, please use the FakeAuth®
                                                login.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <p>This warning banner provides privacy and security notices consistent with
applicable federal laws, directives, and other federal guidance for accessing this
Government system, which includes (1) this computer network, (2) all computers
connected to this network, and (3) all devices and storage media attached to this
network or to a computer on this network.</p>
<p>This system is provided for Government-authorized use only.</p>
<p>Unauthorized or improper use of this system is prohibited and may result in
disciplinary action and/or civil and criminal penalties.</p>
<p>Personal use of social media and networking sites on this system is limited as to
not interfere with official work duties and is subject to monitoring.</p>
<p>By using this system, you understand and consent to the following:
<ul><li>The Government may monitor, record, and audit your system usage,
including usage of personal devices and email systems for official duties
or to conduct HHS business. Therefore, you have no reasonable
expectation of privacy regarding any communication or data transiting or
stored on this system. At any time, and for any lawful Government
purpose, the government may monitor, intercept, and search and seize
any communication or data transiting or stored on this system.</li>
<li>Any communication or data transiting or stored on this system may be
disclosed or used for any lawful Government purpose.</li></ul></p>


                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default Login;
