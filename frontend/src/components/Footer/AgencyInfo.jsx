export const AgencyInfo = () => {
    return (
        <div className="grid-container">
            <div className="grid-row grid-gap">
                <div
                    className="
              usa-footer__logo
              grid-row
              mobile-lg:grid-col-6 mobile-lg:grid-gap-2
            "
                >
                    <div className="mobile-lg:grid-col-auto">
                        <img className="usa-footer__logo-img" src="/assets/img/logo-img.png" alt="" />
                    </div>
                    <div className="mobile-lg:grid-col-auto">
                        <p className="usa-footer__logo-heading">OPRE Portfolio Management System</p>
                    </div>
                </div>
                <div className="usa-footer__contact-links mobile-lg:grid-col-6">
                    <div className="usa-footer__social-links grid-row grid-gap-1"></div>
                    <p className="usa-footer__contact-heading">&lt;Agency Contact Center&gt;</p>
                    <address className="usa-footer__address">
                        <div className="usa-footer__contact-info grid-row grid-gap">
                            <div className="grid-col-auto">
                                <a href="tel:1-800-555-5555">&lt;(800) 555-GOVT&gt;</a>
                            </div>
                            <div className="grid-col-auto">
                                <a href="mailto:info@agency.gov">&lt;info@agency.gov&gt;</a>
                            </div>
                        </div>
                    </address>
                </div>
            </div>
        </div>
    );
};
