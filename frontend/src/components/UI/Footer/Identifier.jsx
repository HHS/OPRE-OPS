import Logo from "../../../images/hhs-logo.jpg";

const Identifier = () => {
    return (
        <div className="usa-identifier">
            <section
                className="usa-identifier__section usa-identifier__section--masthead"
                aria-label="Agency identifier"
            >
                <div className="usa-identifier__container">
                    <div className="usa-identifier__logos">
                        <a
                            href="https://www.hhs.gov/"
                            className="usa-identifier__logo"
                        >
                            <img
                                className="usa-identifier__logo-img radius-pill"
                                src={Logo}
                                alt="U.S. Department of Health & Human Services Logo"
                            />
                        </a>
                    </div>
                    <section
                        className="usa-identifier__identity"
                        aria-label="Agency description"
                    >
                        <p className="usa-identifier__identity-domain">hhs.gov</p>
                        <p className="usa-identifier__identity-disclaimer">
                            An official website of the{" "}
                            <a href="https://www.hhs.gov/">U.S. Department of Health & Human Services</a>
                        </p>
                    </section>
                </div>
            </section>
            <nav
                className="usa-identifier__section usa-identifier__section--required-links"
                aria-label="Important links"
            >
                <div className="usa-identifier__container">
                    <ul className="usa-identifier__required-links-list">
                        <li className="usa-identifier__required-links-item">
                            <a
                                href="https://www.hhs.gov/about/index.html"
                                className="usa-identifier__required-link usa-link"
                            >
                                About HHS
                            </a>
                        </li>
                        <li className="usa-identifier__required-links-item">
                            <a
                                href="https://www.acf.hhs.gov/accessibility"
                                className="usa-identifier__required-link usa-link"
                            >
                                Accessibility support
                            </a>
                        </li>
                        <li className="usa-identifier__required-links-item">
                            <a
                                href="http://www.acf.hhs.gov/"
                                className="usa-identifier__required-link usa-link"
                            >
                                acf.gov
                            </a>
                        </li>
                        <li className="usa-identifier__required-links-item">
                            <a
                                href="https://www.acf.hhs.gov/disclaimers"
                                className="usa-identifier__required-link usa-link"
                            >
                                Disclaimers
                            </a>
                        </li>
                        <li className="usa-identifier__required-links-item">
                            <a
                                href="https://www.acf.hhs.gov/foia"
                                className="usa-identifier__required-link usa-link"
                            >
                                FOIA requests
                            </a>
                        </li>
                        <li className="usa-identifier__required-links-item">
                            <a
                                href="https://www.acf.hhs.gov/about/acf-policies/no-fear-act"
                                className="usa-identifier__required-link usa-link"
                            >
                                No FEAR Act data
                            </a>
                        </li>
                        <li className="usa-identifier__required-links-item">
                            <a
                                href="https://www.acf.hhs.gov/opre"
                                className="usa-identifier__required-link usa-link"
                            >
                                OPRE
                            </a>
                        </li>
                        <li className="usa-identifier__required-links-item">
                            <a
                                href="https://www.acf.hhs.gov/privacy-policy"
                                className="usa-identifier__required-link usa-link"
                            >
                                Privacy policy
                            </a>
                        </li>
                    </ul>
                </div>
            </nav>
            <section
                className="usa-identifier__section usa-identifier__section--usagov"
                aria-label="U.S. government information and services"
            >
                <div className="usa-identifier__container">
                    <div className="usa-identifier__usagov-description">
                        Looking for U.S. government information and services?
                        <a
                            href="https://www.usa.gov/"
                            className="usa-link margin-left-1"
                        >
                            Visit USA.gov
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Identifier;
