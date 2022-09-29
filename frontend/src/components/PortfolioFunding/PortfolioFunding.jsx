const PortfolioFunding = () => {
    return (
        <div className="usa-card__container">
            <div className="usa-card__header">
                <h2 className="use-card__heading">Total Funding</h2>
                <h5>Fiscal Year: 2022</h5>
            </div>
            <div className="usa-card__media">
                <div className="usa-card__img">
                    <img
                        src="https://designsystem.digital.gov/img/introducing-uswds-2-0/built-to-grow--alt.jpg"
                        alt="A placeholder image"
                    />
                </div>
            </div>
            <div className="usa-card__body">
                <h3>$48,000,000</h3>
                <div className="grid-container">
                    <div className="grid-row">
                        <div className="grid-col">Obligated</div>
                        <div className="grid-col">$30,720,000</div>
                    </div>
                    <div className="grid-row">
                        <div className="grid-col">Remaining</div>
                        <div className="grid-col">$17,280,000</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PortfolioFunding;
