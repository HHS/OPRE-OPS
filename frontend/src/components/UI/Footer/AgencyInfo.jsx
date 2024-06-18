function AgencyInfo() {
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
                        <img
                            className="usa-footer__logo-img"
                            src="/assets/img/logo-iomg.png"
                            alt=""
                        />
                    </div>
                    <div className="mobile-lg:grid-col-auto">
                        <p className="usa-footer__logo-heading">OPRE Portfolio Management System</p>
                    </div>
                </div>
                <div className="usa-footer__contact-links mobile-lg:grid-col-6">
                    <div className="usa-footer__social-links grid-row grid-gap-1"></div>
                    <p className="usa-footer__contact-heading"> </p>
                    <address className="usa-footer__address">
                        <div className="usa-footer__contact-info grid-row grid-gap">
                            <div className="grid-col-auto">
                            </div>
                            <div className="grid-col-auto">
                            </div>
                        </div>
                    </address>
                </div>
            </div>
        </div>
    );
}

export default AgencyInfo;
