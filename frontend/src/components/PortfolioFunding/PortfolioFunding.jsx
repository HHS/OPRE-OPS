const PortfolioFunding = () => {
    return (
        <div className="usa-card__container">
            <div className="usa-card__header padding-2">
                <div className="use-card__heading">
                    <h3 className="margin-0">Total Funding</h3>
                    <h5 className="margin-0">Fiscal Year: 2022</h5>
                </div>
            </div>
            <div className="usa-card__media">
                <div className="usa-card__img">
                    <img
                        src="https://designsystem.digital.gov/img/introducing-uswds-2-0/built-to-grow--alt.jpg"
                        alt="A placeholder image"
                    />
                </div>
            </div>
            <div className="usa-card__body padding-2">
                <h3 className="font-body-xl">$48,000,000</h3>
            </div>
        </div>
    );
};

export default PortfolioFunding;
