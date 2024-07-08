const NavFooter = () => {
    return (
        <nav
            className="usa-footer__nav"
            aria-label="Footer navigation"
        >
            <ul className="grid-row grid-gap">
                <li className="usa-footer__primary-content">
                    <a
                        className="usa-footer__primary-link"
                        href="/"
                    >
                        Documentation
                    </a>
                </li>
                <li className="usa-footer__primary-content">
                    <a
                        className="usa-footer__primary-link"
                        href="/"
                    >
                        Features
                    </a>
                </li>
                <li className="usa-footer__primary-content">
                    <a
                        className="usa-footer__primary-link"
                        href="/"
                    >
                        Getting Started
                    </a>
                </li>
                <li className="usa-footer__primary-content">
                    <a
                        className="usa-footer__primary-link"
                        href="/"
                    >
                        About
                    </a>
                </li>
            </ul>
        </nav>
    );
};

export default NavFooter;
