import PortfolioFunding from "../PortfolioFunding/PortfolioFunding";

const PortfolioFundingSummary = (props) => {
    return (
        <>
            <h3 className="site-preview-heading">Funding Summary</h3>
            <div className="usa-card-group">
                <li className="usa-card usa-card--flag usa-card--media-right">
                    <PortfolioFunding portfolioId={props.portfolioId} />
                </li>
                <li className="usa-card usa-card--flag usa-card--media-right">
                    <PortfolioFunding portfolioId={props.portfolioId} />
                </li>
            </div>
        </>
    );
};

export default PortfolioFundingSummary;
