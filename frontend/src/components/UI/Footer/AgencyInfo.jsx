import Logo from "../../../images/acf-logo.jpg";

export const AgencyInfo = () => (
    <div className="grid-container">
        <div className="grid-row grid-gap">
            <div className="usa-footer__logo grid-row mobile-lg:grid-col-6 mobile-lg:grid-gap-2">
                <div className="mobile-lg:grid-col-auto display-flex flex-align-center">
                    <img className="usa-footer__logo-img radius-pill" src={Logo} alt="agency logo" />
                    <p className="usa-footer__logo-heading margin-left-2">OPRE Portfolio Management System</p>
                </div>
            </div>
        </div>
    </div>
);
